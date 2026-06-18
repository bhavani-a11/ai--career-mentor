"""
Dummy MongoDB module to allow resume.py to import without errors.
The routes that don't use MongoDB (all AI features) will work fine.
"""

from typing import Any, Dict
from datetime import datetime

# Dummy ObjectId class
class ObjectId:
    def __init__(self, oid: str = None):
        self.oid = oid or "dummy_id"
    
    @classmethod
    def is_valid(cls, oid: str) -> bool:
        return True
    
    def __str__(self):
        return self.oid

# Dummy AsyncIOMotorDatabase class
class AsyncIOMotorDatabase:
    def __getitem__(self, collection_name: str):
        return DummyCollection()

class DummyCollection:
    async def find(self, query: Dict[str, Any]):
        return DummyCursor()
    
    async def find_one(self, query: Dict[str, Any]):
        return None
    
    async def insert_one(self, doc: Dict[str, Any]):
        return DummyInsertResult()
    
    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any]):
        return DummyUpdateResult()
    
    async def delete_one(self, query: Dict[str, Any]):
        return DummyDeleteResult()

class DummyCursor:
    def sort(self, *args, **kwargs):
        return self
    
    async def to_list(self, length: int):
        return []

class DummyInsertResult:
    def __init__(self):
        self.inserted_id = ObjectId()

class DummyUpdateResult:
    pass

class DummyDeleteResult:
    def __init__(self):
        self.deleted_count = 0

# Dummy get_database dependency
async def get_database() -> AsyncIOMotorDatabase:
    return AsyncIOMotorDatabase()
