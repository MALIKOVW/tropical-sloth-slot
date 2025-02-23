import os
from flask import Flask, render_template, jsonify, session, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import random
import json

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///slots.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

# Import models before creating tables
from models import SpinResult  # noqa: E402

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000  # Starting credits
    if 'bonus_spins' not in session:
        session['bonus_spins'] = 0
    return render_template('index.html', credits=session['credits'], bonus_spins=session['bonus_spins'])

@app.route('/spin', methods=['POST'])
def spin():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    symbols = ['dog', 'house', 'bone', 'collar', 'paw']
    try:
        bet = int(request.form.get('bet', 10))
        is_bonus_spin = bool(session.get('bonus_spins', 0))

        if not is_bonus_spin:
            if bet < 10 or bet > 100:
                return jsonify({'error': 'Invalid bet amount'}), 400
            if session['credits'] < bet:
                return jsonify({'error': 'Insufficient credits'}), 400
            session['credits'] -= bet
        else:
            session['bonus_spins'] -= 1

        # Generate result
        result = [
            [random.choice(symbols) for _ in range(5)],
            [random.choice(symbols) for _ in range(5)],
            [random.choice(symbols) for _ in range(5)]
        ]

        # Calculate winnings and bonus spins
        winnings, bonus_spins = calculate_winnings(result, bet)
        session['credits'] += winnings

        if bonus_spins > 0:
            session['bonus_spins'] = session.get('bonus_spins', 0) + bonus_spins

        spin_result = SpinResult(
            bet_amount=bet,
            win_amount=winnings,
            result_matrix=json.dumps(result),
            bonus_spins_awarded=bonus_spins,
            is_bonus_spin=is_bonus_spin
        )
        db.session.add(spin_result)
        db.session.commit()

        return jsonify({
            'result': result,
            'winnings': winnings,
            'credits': session['credits'],
            'bonus_spins_awarded': bonus_spins,
            'bonus_spins_remaining': session.get('bonus_spins', 0)
        })
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid bet amount'}), 400

def calculate_winnings(result, bet):
    winnings = 0
    bonus_spins = 0

    # Check middle row for regular wins
    middle_row = result[1]
    matches = 1
    symbol = middle_row[0]

    for i in range(1, len(middle_row)):
        if middle_row[i] == symbol:
            matches += 1
        else:
            break

    if matches >= 3:
        winnings = bet * (matches * 2)

    # Check for bonus game trigger (3 or more 'paw' symbols anywhere)
    paw_count = sum(row.count('paw') for row in result)
    if paw_count >= 3:
        bonus_spins = paw_count * 2  # 2 free spins per paw symbol

    return winnings, bonus_spins

with app.app_context():
    # Drop all tables and recreate them
    db.drop_all()
    db.create_all()