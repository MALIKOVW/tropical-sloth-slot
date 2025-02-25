# Tropical Sloth Slot Machine

A dynamic slot machine simulator featuring innovative wild symbol mechanics and engaging interactive elements.

## Features

- Multiple wild symbols (2x, 3x, 5x) appearing on reels 2, 3, and 4
- Multiplier combinations for enhanced winnings
- Dynamic symbol animations and visual effects
- Responsive design with wild symbol interactions
- Sound effects and background music
- Session-based credit system
- Statistical tracking of game outcomes

## Technical Stack

- Backend: Flask (Python)
- Frontend: Vanilla JavaScript
- Database: PostgreSQL
- Audio: Tone.js
- Graphics: Custom PNG assets

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL database URL
   - `SESSION_SECRET`: Secret key for Flask sessions

4. Run the application:
```bash
python main.py
```

The server will start on port 5000.

## Game Rules

- Wild symbols (2x, 3x, 5x) appear only on reels 2, 3, and 4
- Wild symbols substitute for all symbols except scatter
- Multiple wild symbols multiply their values (e.g., 2x and 3x = 6x multiplier)
- Minimum bet: 0.20
- Maximum bet: 100.00

## License

This project is proprietary and confidential.
