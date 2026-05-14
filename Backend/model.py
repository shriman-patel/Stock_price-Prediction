from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)

class Portfolio(Base):

    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True)

    ticker = Column(String)

    quantity = Column(Integer)

    buy_price = Column(Float)

    user_id = Column(Integer, ForeignKey("users.id"))