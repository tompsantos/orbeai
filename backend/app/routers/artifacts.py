from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import Artifact, ArtifactVersion, Project
from app.schemas.artifacts import (
    ArtifactCreate,
    ArtifactRead,
    ArtifactUpdate,
    ArtifactVersionCreate,
    ArtifactVersionRead,
)
from app.services.bootstrap import get_or_create_default_workspace

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


def get_project_or_404(project_id: str, db: Session) -> Project:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def get_artifact_or_404(artifact_id: str, db: Session) -> Artifact:
    artifact = db.scalar(
        select(Artifact)
        .where(Artifact.id == artifact_id)
        .options(selectinload(Artifact.versions))
    )

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found",
        )

    return artifact


def next_version_number(artifact_id: str, db: Session) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(ArtifactVersion.version_number), 0))
        .where(ArtifactVersion.artifact_id == artifact_id)
    )

    return int(current or 0) + 1


@router.post("", response_model=ArtifactRead, status_code=status.HTTP_201_CREATED)
def create_artifact(payload: ArtifactCreate, db: Session = Depends(get_db)) -> Artifact:
    workspace = get_or_create_default_workspace(db)
    project_id = payload.project_id

    if project_id is not None:
        project = get_project_or_404(project_id, db)
        workspace_id = project.workspace_id
    else:
        workspace_id = workspace.id

    artifact = Artifact(
        workspace_id=workspace_id,
        project_id=project_id,
        title=payload.title,
        kind=payload.kind,
        status="draft",
        source_type=payload.source_type,
        source_product=payload.source_product,
        source_entity_id=payload.source_entity_id,
    )

    db.add(artifact)
    db.commit()
    db.refresh(artifact)

    version = ArtifactVersion(
        artifact_id=artifact.id,
        version_number=1,
        content=payload.content,
    )

    db.add(version)
    db.commit()

    return get_artifact_or_404(artifact.id, db)


@router.get("", response_model=list[ArtifactRead])
def list_artifacts(
    project_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Artifact]:
    statement = select(Artifact).options(selectinload(Artifact.versions))

    if project_id is not None:
        statement = statement.where(Artifact.project_id == project_id)

    result = db.scalars(statement.order_by(Artifact.updated_at.desc()))

    return list(result)


@router.get("/{artifact_id}", response_model=ArtifactRead)
def get_artifact(artifact_id: str, db: Session = Depends(get_db)) -> Artifact:
    return get_artifact_or_404(artifact_id, db)


@router.patch("/{artifact_id}", response_model=ArtifactRead)
def update_artifact(
    artifact_id: str,
    payload: ArtifactUpdate,
    db: Session = Depends(get_db),
) -> Artifact:
    artifact = get_artifact_or_404(artifact_id, db)
    changes = payload.model_dump(exclude_unset=True)

    if "project_id" in changes:
        project_id = changes.pop("project_id")

        if project_id is None:
            artifact.project_id = None
        else:
            project = get_project_or_404(project_id, db)
            artifact.project_id = project.id
            artifact.workspace_id = project.workspace_id

    for field, value in changes.items():
        setattr(artifact, field, value)

    db.add(artifact)
    db.commit()

    return get_artifact_or_404(artifact.id, db)


@router.post("/{artifact_id}/versions", response_model=ArtifactVersionRead, status_code=status.HTTP_201_CREATED)
def create_artifact_version(
    artifact_id: str,
    payload: ArtifactVersionCreate,
    db: Session = Depends(get_db),
) -> ArtifactVersion:
    artifact = get_artifact_or_404(artifact_id, db)

    version = ArtifactVersion(
        artifact_id=artifact.id,
        version_number=next_version_number(artifact.id, db),
        content=payload.content,
    )

    db.add(version)
    db.add(artifact)
    db.commit()
    db.refresh(version)

    return version


@router.delete("/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artifact(artifact_id: str, db: Session = Depends(get_db)) -> None:
    artifact = db.get(Artifact, artifact_id)

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found",
        )

    db.execute(delete(ArtifactVersion).where(ArtifactVersion.artifact_id == artifact_id))
    db.delete(artifact)
    db.commit()

    return None
