import os
from flask import Flask, render_template, jsonify, session, request
import random
from datetime import datetime
from database import db

# create the app
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
db.init_app(app)

with app.app_context():
    # Make sure to import the models here or their tables won't be created
    from models import SpinResult, Statistics  # noqa: F401

    try:
        # Create all tables
        db.create_all()

        # Initialize statistics if needed
        if not Statistics.query.first():
            initial_stats = Statistics()
            db.session.add(initial_stats)
            db.session.commit()
            print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000
    if 'bonus_spins' not in session:
        session['bonus_spins'] = 0
    return render_template('index.html', credits=session['credits'])

@app.route('/spin', methods=['POST'])
def spin():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    try:
        bet = float(request.form.get('bet', 0.20))
        if bet < 0.20 or bet > 100:
            return jsonify({'error': 'Invalid bet amount'}), 400
        if session['credits'] < bet:
            return jsonify({'error': 'Insufficient credits'}), 400

        # Deduct bet
        session['credits'] = session['credits'] - bet

        # Define symbols and their weights
        regular_symbols = {
            'wooden_a': 20,    # Most common
            'wooden_k': 18,
            'wooden_arch': 16,
            'snake': 14,
            'gorilla': 12,
            'jaguar': 10,
            'crocodile': 8,
            'gator': 6,
            'leopard': 4,
            'dragon': 2,       # Rarest
            'sloth': 1         # Scatter
        }

        # Define wild symbols (только для барабанов 2, 3, 4)
        wild_symbols = {
            'wild_2x': 2,
            'wild_3x': 2,
            'wild_5x': 1
        }

        # Create weighted symbol lists
        regular_weighted_symbols = []
        for symbol, weight in regular_symbols.items():
            regular_weighted_symbols.extend([symbol] * weight)

        wild_weighted_symbols = []
        for symbol, weight in wild_symbols.items():
            wild_weighted_symbols.extend([symbol] * weight)

        # Generate result
        result = []
        for reel_index in range(5):
            reel = []
            for _ in range(3):
                # Только для барабанов 2, 3, 4 (индексы 1, 2, 3) добавляем возможность выпадения wild
                if reel_index in [1, 2, 3]:
                    # 20% шанс на wild символ
                    if random.random() < 0.20:
                        symbol = random.choice(wild_weighted_symbols)
                    else:
                        symbol = random.choice(regular_weighted_symbols)
                else:
                    # Для барабанов 1 и 5 только обычные символы
                    symbol = random.choice(regular_weighted_symbols)
                reel.append(symbol)
            result.append(reel)

        # Calculate winnings based on paylines and wild multipliers
        winnings = calculate_winnings(result, bet)

        # Add winnings
        session['credits'] = session['credits'] + winnings

        return jsonify({
            'result': result,
            'winnings': winnings,
            'credits': session['credits']
        })

    except Exception as e:
        print(f"Error during spin: {str(e)}")
        return jsonify({'error': 'An error occurred during spin'}), 400

def calculate_winnings(result, bet):
    paylines = [
        # Horizontal lines
        [(0,0), (1,0), (2,0), (3,0), (4,0)],  # Top
        [(0,1), (1,1), (2,1), (3,1), (4,1)],  # Middle
        [(0,2), (1,2), (2,2), (3,2), (4,2)],  # Bottom
        # V-shaped lines
        [(0,0), (1,1), (2,2), (3,1), (4,0)],  # V
        [(0,2), (1,1), (2,0), (3,1), (4,2)],  # Inverted V
        # Zigzag lines
        [(0,0), (1,1), (2,0), (3,1), (4,0)],
        [(0,2), (1,1), (2,2), (3,1), (4,2)]
    ]

    winnings = 0
    for line in paylines:
        symbols = [result[x][y] for x, y in line]

        # Get base symbol (first non-wild symbol)
        base_symbol = next((s for s in symbols if not s.startswith('wild_') and s != 'sloth'), None)

        if base_symbol:
            # Calculate multiplier from wilds
            multiplier = 1
            wild_count = 0
            for symbol in symbols:
                if symbol.startswith('wild_'):
                    wild_count += 1
                    if symbol == 'wild_2x':
                        multiplier *= 2
                    elif symbol == 'wild_3x':
                        multiplier *= 3
                    elif symbol == 'wild_5x':
                        multiplier *= 5

            # Check if we have a winning combination
            if all(s == base_symbol or s.startswith('wild_') for s in symbols):
                # Calculate base win amount based on symbol value
                symbol_values = {
                    'wooden_a': 2,
                    'wooden_k': 3,
                    'wooden_arch': 4,
                    'snake': 5,
                    'gorilla': 6,
                    'jaguar': 8,
                    'crocodile': 10,
                    'gator': 15,
                    'leopard': 20,
                    'dragon': 50
                }

                base_value = symbol_values.get(base_symbol, 0)
                line_win = bet * base_value * multiplier
                winnings += line_win

    return winnings

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)