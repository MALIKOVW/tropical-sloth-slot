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

# Define winning lines (The Dog House style)
WINNING_LINES = [
    # Горизонтальные линии
    [(0,0), (0,1), (0,2), (0,3), (0,4)],  # Top row
    [(1,0), (1,1), (1,2), (1,3), (1,4)],  # Middle row
    [(2,0), (2,1), (2,2), (2,3), (2,4)],  # Bottom row

    # V-образные линии
    [(0,0), (1,1), (2,2), (1,3), (0,4)],
    [(2,0), (1,1), (0,2), (1,3), (2,4)],

    # Зигзагообразные линии
    [(0,0), (1,1), (1,2), (1,3), (0,4)],
    [(2,0), (1,1), (1,2), (1,3), (2,4)],

    # W-образные линии
    [(0,0), (2,1), (1,2), (2,3), (0,4)],
    [(2,0), (0,1), (1,2), (0,3), (2,4)],

    # Диагональные линии
    [(0,0), (1,1), (2,2), (1,3), (0,4)],
    [(2,0), (1,1), (0,2), (1,3), (2,4)]
]

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000  # Starting credits
    if 'bonus_spins' not in session:
        session['bonus_spins'] = 0
    if 'wild_positions' not in session:
        session['wild_positions'] = []
    return render_template('index.html', credits=session['credits'], bonus_spins=session['bonus_spins'])

@app.route('/spin', methods=['POST'])
def spin():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    symbols = ['dog', 'house', 'bone', 'collar', 'paw', 'wild'] if not session.get('bonus_spins', 0) else ['dog', 'house', 'bone', 'collar', 'wild']
    try:
        bet = int(request.form.get('bet', 10))
        is_bonus_spin = bool(session.get('bonus_spins', 0))
        is_respin = bool(request.form.get('is_respin', False))

        # Check if player has enough credits
        if not is_bonus_spin and not is_respin:
            if bet < 10 or bet > 100:
                return jsonify({'error': 'Invalid bet amount'}), 400
            if session['credits'] < bet:
                return jsonify({'error': 'Insufficient credits'}), 400
            # Deduct bet amount
            session['credits'] = session['credits'] - bet
            session.modified = True

        # Generate result
        result = []
        wild_positions = session.get('wild_positions', []) if is_bonus_spin else []

        for i in range(3):
            row = []
            for j in range(5):
                if is_bonus_spin and [i, j] in wild_positions:
                    row.append('wild')
                else:
                    if random.random() < 0.15 and not is_respin:  # Increased wild chance to 15%
                        symbol = 'wild'
                        if is_bonus_spin:
                            wild_positions.append([i, j])
                    else:
                        symbol = random.choice(symbols)
                    row.append(symbol)
            result.append(row)

        if is_bonus_spin:
            session['wild_positions'] = wild_positions
            session.modified = True

        # Calculate winnings and check for respins/bonus
        winnings = 0
        bonus_spins = 0
        needs_respin = False

        if not is_bonus_spin:
            # Count scatter symbols (paw)
            scatter_count = sum(row.count('paw') for row in result)
            if scatter_count >= 4 and not any(result[i][4] == 'paw' for i in range(3)):
                needs_respin = True
            elif scatter_count >= 5:
                bonus_spins = scatter_count * 3  # Increased bonus spins
                session['bonus_spins'] = session.get('bonus_spins', 0) + bonus_spins
                session['wild_positions'] = []
                session.modified = True

        # Calculate line wins with increased multipliers for 97% RTP
        for line in WINNING_LINES:
            matches = 1
            first_symbol = result[line[0][0]][line[0][1]]
            if first_symbol == 'paw':  # Skip scatter symbols for line wins
                continue

            for i in range(1, len(line)):
                current_pos = line[i]
                current_symbol = result[current_pos[0]][current_pos[1]]
                if current_symbol == 'wild' or first_symbol == 'wild' or current_symbol == first_symbol:
                    matches += 1
                else:
                    break

            if matches >= 3:
                # Increased multipliers for higher RTP
                multiplier = {
                    'dog': 8,      # Increased from 5
                    'house': 6,    # Increased from 4
                    'bone': 5,     # Increased from 3
                    'collar': 4,   # Increased from 2
                    'wild': 10     # Increased from 6
                }.get(first_symbol if first_symbol != 'wild' else 'wild', 3)

                win_amount = bet * multiplier * (matches - 2)
                winnings += win_amount

        # Add winnings to credits
        if not is_respin:
            session['credits'] = session['credits'] + winnings
            session.modified = True

        if is_bonus_spin:
            session['bonus_spins'] = max(0, session['bonus_spins'] - 1)
            session.modified = True

        # Save spin result
        spin_result = SpinResult(
            bet_amount=bet,
            win_amount=winnings,
            result_matrix=json.dumps(result),
            bonus_spins_awarded=bonus_spins,
            is_bonus_spin=is_bonus_spin,
            wild_positions=json.dumps(wild_positions),
            is_respin=is_respin
        )
        db.session.add(spin_result)
        db.session.commit()

        return jsonify({
            'result': result,
            'winnings': winnings,
            'credits': session['credits'],
            'bonus_spins_awarded': bonus_spins,
            'bonus_spins_remaining': session.get('bonus_spins', 0),
            'needs_respin': needs_respin,
            'wild_positions': wild_positions
        })
    except (ValueError, TypeError) as e:
        print(f"Error during spin: {str(e)}")
        return jsonify({'error': 'Invalid bet amount'}), 400

with app.app_context():
    db.create_all()