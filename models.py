from app import db
from datetime import datetime

class SpinResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    bet_amount = db.Column(db.Integer, nullable=False)
    win_amount = db.Column(db.Integer, nullable=False)
    result_matrix = db.Column(db.String(255), nullable=False)
