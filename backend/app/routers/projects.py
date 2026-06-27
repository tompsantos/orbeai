from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, Workspace
from app.schemas.projects import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])

DEFAULT_WORKSPACE_NAME = "orbeOne"
DEFAULT_WORKSPACE_SLUG = "orbeone"


def get_or_create_default_workspace(db: Session) -> Workspace:
    workspace = db.scalar(
        select(Workspace).where(Workspace.slug == DEFAULT_WORKSPACE_SLUG)
    )

    if workspace is not None:
        return workspace

    workspace = Workspace(
        name=DEFAULT_WORKSPACE_NAME,
        slug=DEFAULT_WORKSPACE_SLUG,
        plan="internal",
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> Project:
    workspace = get_or_create_default_workspace(db)

    project = Project(
        workspace_id=workspace.id,
        name=payload.name,
        slug=payload.slug,
        product=payload.product,
        description=payload.description,
        status="active",
    )

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)) -> list[Project]:
    result = db.scalars(
        select(Project).order_by(Project.created_at.desc())
    )
    return list(result)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
) -> Project:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)

    return project
