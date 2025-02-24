from datetime import datetime
from database import db

class SpinResult(db.Model):
    __tablename__ = 'spin_results'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    bet_amount = db.Column(db.Float, nullable=False)
    win_amount = db.Column(db.Float, nullable=False)
    result_matrix = db.Column(db.String(255), nullable=False)
    bonus_spins_awarded = db.Column(db.Integer, default=0)
    is_bonus_spin = db.Column(db.Boolean, default=False)
    wild_positions = db.Column(db.String(255), nullable=True)  # JSON string storing wild positions
    is_respin = db.Column(db.Boolean, default=False)
    winning_lines = db.Column(db.Integer, default=0)  # Number of winning lines in this spin
    symbol_counts = db.Column(db.String(255), nullable=True)  # JSON string storing symbol frequencies

class Statistics(db.Model):
    __tablename__ = 'statistics'

    id = db.Column(db.Integer, primary_key=True)
    total_spins = db.Column(db.Integer, default=0)
    total_wins = db.Column(db.Integer, default=0)
    total_bonus_games = db.Column(db.Integer, default=0)
    biggest_win = db.Column(db.Float, default=0)
    total_bet = db.Column(db.Float, default=0)
    total_won = db.Column(db.Float, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)