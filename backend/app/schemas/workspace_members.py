from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    user_id: str
    user_email: str
    user_name: str
    user_status: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime


class WorkspaceMemberAccessRead(BaseModel):
    workspace_id: str
    member_id: str
    user_id: str
    role: str
    status: str
    permissions: list[str]
