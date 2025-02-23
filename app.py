import os
from flask import Flask, render_template, jsonify, session, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import random
import json
from datetime import datetime

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

from models import SpinResult, Statistics

with app.app_context():
    db.drop_all()
    db.create_all()
    if not Statistics.query.first():
        initial_stats = Statistics()
        db.session.add(initial_stats)
        db.session.commit()

# Define winning lines (20 lines)
WINNING_LINES = [
    # Горизонтальные линии
    [(0,0), (0,1), (0,2), (0,3), (0,4)],  # Top row
    [(1,0), (1,1), (1,2), (1,3), (1,4)],  # Middle row
    [(2,0), (2,1), (2,2), (2,3), (2,4)],  # Bottom row

    # Диагональные линии
    [(0,0), (1,1), (2,2), (1,3), (0,4)],
    [(2,0), (1,1), (0,2), (1,3), (2,4)],

    # V-образные линии
    [(0,0), (1,1), (2,2), (1,3), (0,4)],
    [(2,0), (1,1), (0,2), (1,3), (2,4)],

    # Зигзагообразные линии
    [(0,0), (1,1), (1,2), (1,3), (0,4)],
    [(2,0), (1,1), (1,2), (1,3), (2,4)],
    [(0,0), (0,1), (1,2), (0,3), (0,4)],
    [(2,0), (2,1), (1,2), (2,3), (2,4)],

    # Дополнительные линии
    [(1,0), (0,1), (0,2), (0,3), (1,4)],
    [(1,0), (2,1), (2,2), (2,3), (1,4)],
    [(0,0), (2,1), (2,2), (2,3), (0,4)],
    [(2,0), (0,1), (0,2), (0,3), (2,4)],
    [(1,0), (0,1), (1,2), (0,3), (1,4)],
    [(1,0), (2,1), (1,2), (2,3), (1,4)],
    [(0,0), (1,1), (2,2), (1,3), (1,4)],
    [(2,0), (1,1), (0,2), (1,3), (1,4)],
    [(1,0), (1,1), (0,2), (1,3), (1,4)]
]

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000
    if 'bonus_spins' not in session:
        session['bonus_spins'] = 0
    if 'wild_positions' not in session:
        session['wild_positions'] = []
    return render_template('index.html', credits=session['credits'])

@app.route('/spin', methods=['POST'])
def spin():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    # Symbols configuration
    low_symbols = ['10', 'J', 'Q', 'K', 'A']
    high_symbols = ['dog1', 'dog2', 'dog3', 'toy1', 'toy2']
    special_symbols = ['wild', 'scatter']

    all_symbols = low_symbols + high_symbols
    if not session.get('bonus_spins', 0):
        all_symbols.append('wild')  # Only add wild to regular spins pool

    try:
        bet = float(request.form.get('bet', 0.20))
        is_bonus_spin = bool(session.get('bonus_spins', 0))
        is_respin = bool(request.form.get('is_respin', False))

        # Get or create statistics
        stats = Statistics.query.first()
        if not stats:
            stats = Statistics()
            db.session.add(stats)

        if not is_bonus_spin and not is_respin:
            if bet < 0.20 or bet > 100:
                return jsonify({'error': 'Invalid bet amount'}), 400
            if session['credits'] < bet:
                return jsonify({'error': 'Insufficient credits'}), 400
            session['credits'] = session['credits'] - bet

            stats.total_spins += 1
            stats.total_bet += bet

        # Generate result with scatter only on reels 1, 3, and 5
        result = []
        wild_positions = session.get('wild_positions', []) if is_bonus_spin else []
        scatter_reels = [0, 2, 4]  # Reels 1, 3, and 5
        scatter_positions = []  # Track scatter positions

        for i in range(3):  # rows
            row = []
            for j in range(5):  # reels
                if is_bonus_spin and [i, j] in wild_positions:
                    row.append('wild')
                else:
                    # Check if this position can have a scatter
                    can_have_scatter = (j in scatter_reels and 
                                        not any([pos[1] == j for pos in scatter_positions]) and 
                                        not is_bonus_spin)

                    # Increased wild chance in bonus spins (25% vs 15% in base game)
                    wild_chance = 0.25 if is_bonus_spin else 0.15

                    if can_have_scatter and random.random() < 0.15:  # 15% chance for scatter
                        symbol = 'scatter'
                        scatter_positions.append([i, j])
                    elif random.random() < wild_chance and not is_respin:
                        symbol = 'wild'
                        if is_bonus_spin:
                            wild_positions.append([i, j])
                    else:
                        symbol = random.choice(all_symbols)
                    row.append(symbol)
            result.append(row)

        if is_bonus_spin:
            session['wild_positions'] = wild_positions

        # Calculate winnings
        winnings = 0
        bonus_spins = 0
        needs_respin = False
        winning_lines_count = 0

        # Check scatters only during base game
        if not is_bonus_spin:
            scatter_count = len(scatter_positions)
            if scatter_count >= 3:
                bonus_spins = scatter_count * 5  # 5 free spins per scatter
                session['bonus_spins'] = session.get('bonus_spins', 0) + bonus_spins
                session['wild_positions'] = []  # Reset wild positions for new bonus round

        # Calculate line wins
        winning_lines_data = []
        for line in WINNING_LINES:
            matches = 1
            first_symbol = result[line[0][0]][line[0][1]]
            if first_symbol == 'scatter':
                continue

            for i in range(1, len(line)):
                current_pos = line[i]
                current_symbol = result[current_pos[0]][current_pos[1]]
                if current_symbol == 'wild' or first_symbol == 'wild' or current_symbol == first_symbol:
                    matches += 1
                else:
                    break

            if matches >= 3:
                winning_lines_count += 1
                winning_lines_data.append(line[:matches])

                # Updated multipliers for 96.51% RTP with max win 6,750x
                multipliers = {
                    # Low paying symbols (3, 4, 5 matches)
                    '10': [5, 25, 100],
                    'J': [10, 50, 200],
                    'Q': [15, 75, 300],
                    'K': [20, 100, 400],
                    'A': [25, 125, 500],

                    # High paying symbols
                    'dog1': [50, 250, 1000],
                    'dog2': [75, 375, 1500],
                    'dog3': [100, 500, 2000],
                    'toy1': [40, 200, 800],
                    'toy2': [30, 150, 600],

                    # Special symbols
                    'wild': [125, 625, 2500],  # Wild symbol has the highest payouts
                }

                symbol_type = first_symbol if first_symbol != 'wild' else 'wild'
                win_multiplier = multipliers.get(symbol_type, [5, 25, 100])[matches - 3]

                # Increase winnings during bonus spins
                if is_bonus_spin:
                    win_multiplier *= 2.7  # Increase multiplier in bonus spins to achieve max win 6,750x

                win_amount = bet * win_multiplier
                winnings += win_amount

        if not is_respin:
            session['credits'] = float(session['credits'] + winnings)

        if is_bonus_spin:
            session['bonus_spins'] = max(0, session['bonus_spins'] - 1)
            if session['bonus_spins'] == 0:
                session['wild_positions'] = []  # Clear wild positions when bonus round ends

        session.modified = True

        # Update statistics
        if winnings > 0:
            stats.total_wins += 1
            stats.total_won += winnings
            if winnings > stats.biggest_win:
                stats.biggest_win = winnings

        if bonus_spins > 0:
            stats.total_bonus_games += 1

        stats.last_updated = datetime.utcnow()
        db.session.commit()

        spin_result = SpinResult(
            bet_amount=bet,
            win_amount=winnings,
            result_matrix=json.dumps(result),
            bonus_spins_awarded=bonus_spins,
            is_bonus_spin=is_bonus_spin,
            wild_positions=json.dumps(wild_positions),
            is_respin=is_respin,
            winning_lines=winning_lines_count,
            symbol_counts=json.dumps({symbol: sum(row.count(symbol) for row in result) for symbol in all_symbols})
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
            'wild_positions': wild_positions,
            'winning_lines': winning_lines_data
        })
    except Exception as e:
        print(f"Error during spin: {str(e)}")
        return jsonify({'error': 'An error occurred during spin'}), 400

@app.route('/statistics')
def get_statistics():
    stats = Statistics.query.first()
    if not stats:
        stats = Statistics()
        db.session.add(stats)
        db.session.commit()

    return jsonify({
        'total_spins': stats.total_spins,
        'total_wins': stats.total_wins,
        'win_rate': round((stats.total_wins / stats.total_spins * 100) if stats.total_spins > 0 else 0, 2),
        'biggest_win': stats.biggest_win,
        'total_bet': stats.total_bet,
        'total_won': stats.total_won,
        'rtp': round((stats.total_won / stats.total_bet * 100) if stats.total_bet > 0 else 0, 2),
        'total_bonus_games': stats.total_bonus_games
    })

@app.route('/buy_freespins', methods=['POST'])
def buy_freespins():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    # Check if bonus round is active
    if session.get('bonus_spins', 0) > 0:
        return jsonify({'error': 'Cannot buy free spins during bonus round'}), 400

    try:
        bet = float(request.form.get('bet', 0.20))
        cost = bet * 10

        if session['credits'] < cost:
            return jsonify({'error': 'Insufficient credits'}), 400

        # Deduct the cost
        session['credits'] = session['credits'] - cost

        # Award 10 free spins
        bonus_spins = 10
        session['bonus_spins'] = session.get('bonus_spins', 0) + bonus_spins
        session['wild_positions'] = []

        # Update statistics
        stats = Statistics.query.first()
        if stats:
            stats.total_bonus_games += 1
            stats.total_bet += cost
            db.session.commit()

        return jsonify({
            'credits': session['credits'],
            'bonus_spins_awarded': bonus_spins,
            'bonus_spins_remaining': session['bonus_spins']
        })

    except Exception as e:
        print(f"Error buying free spins: {str(e)}")
        return jsonify({'error': 'An error occurred while buying free spins'}), 400