# Tropical Slot Machine

Тропическая слот-машина с уникальной механикой умножителей и разнообразными символами животных.

## Функции

- Множество символов с различными выплатами
- Специальные Wild символы с множителями (x2, x3, x5)
- 20 линий выплат с различными паттернами
- Анимированные выигрышные комбинации
- Звуковые эффекты и фоновая музыка

## Символы и выплаты

### Базовые символы
- 10 - выплата 1x ставки
- J - выплата 1.5x ставки
- Q - выплата 1.8x ставки
- Деревянная A - выплата 2x ставки
- Деревянная K - выплата 3x ставки
- Деревянная арка - выплата 4x ставки

### Средние символы
- Змея - выплата 5x ставки
- Горилла - выплата 6x ставки
- Ягуар - выплата 8x ставки
- Крокодил - выплата 10x ставки
- Аллигатор - выплата 15x ставки
- Леопард - выплата 20x ставки

### Высокооплачиваемый символ
- Дракон - выплата 50x ставки

### Специальные символы
- Ленивец - скаттер символ
- Wild x2 - множитель x2
- Wild x3 - множитель x3
- Wild x5 - множитель x5

## Технический стек

- Backend: Flask (Python)
- Frontend: Vanilla JavaScript
- Аудио: Tone.js
- Графика: PNG assets

## Установка и запуск

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
pip install -r requirements.txt
```
3. Запустите приложение:
```bash
python main.py
```

Сервер запустится на порту 5000.

## Правила игры

- Wild символы появляются только на барабанах 2, 3 и 4
- Wild символы заменяют все символы, кроме скаттера
- Несколько Wild символов умножают свои значения
- Минимальная ставка: 0.20
- Максимальная ставка: 100.00

## Линии выплат

Всего 20 линий выплат:
1. Горизонтальные линии (1-3)
2. V-образные линии (4-8)
3. Зигзагообразные линии (9-13)
4. Сложные паттерны (14-20)

## Лицензия

Проприетарное программное обеспечение. Все права защищены.