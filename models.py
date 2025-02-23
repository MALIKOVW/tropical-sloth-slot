from app import db
from datetime import datetime

class SpinResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    bet_amount = db.Column(db.Integer, nullable=False)
    win_amount = db.Column(db.Integer, nullable=False)
    result_matrix = db.Column(db.String(255), nullable=False)
    bonus_spins_awarded = db.Column(db.Integer, default=0)
    is_bonus_spin = db.Column(db.Boolean, default=False)
    wild_positions = db.Column(db.String(255), nullable=True)  # JSON string storing wild positions
    is_respin = db.Column(db.Boolean, default=False)