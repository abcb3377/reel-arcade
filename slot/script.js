const betDisplay = document.getElementById("betDisplay");
const betValue = document.getElementById("bet");

const audioContext = new AudioContext();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "square";

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

const symbols = [
    "⭐",
    "🍀",
    "💎",
    "🔥",
    "🍒",
];

const reels = document.getElementById("reels");
const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");
const coinDisplay = document.getElementById("coin");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const comboPopup = document.getElementById("comboPopup");

const startButton = document.getElementById("startButton");
const autoButton = document.getElementById("autoButton");
const resetButton = document.getElementById("resetButton");
const infoButton = document.getElementById("infoButton");
const infoPanel = document.getElementById("infoPanel");

let bet = 10;
let score = 0;
let combo = 0;
let coin = 1000;
let spinning = false;
let gameStarted = false;
let stopped = [false, false, false];

function randomSymbol() {
    const random = Math.random() * 100;

    if (random < 30) {
        return "🍒";
    } else if (random < 55) {
        return "🍀";
    } else if (random < 75) {
        return "⭐";
    } else if (random < 90) {
        return "🔥";
    } else {
        return "💎";
    }
}

function createReels() {
    reels.innerHTML = "";

    for (let column = 0; column < 3; column++) {
        const reel = document.createElement("div");
        reel.className = "reel";

        for (let row = 0; row < 3; row++) {
            const symbol = document.createElement("div");

            symbol.className = "symbol";
            symbol.textContent = randomSymbol();

            reel.appendChild(symbol);
        }

        reels.appendChild(reel);
    }
}

function spinReel(reel, index) {
    reel.classList.add("spinning");

    const interval = setInterval(() => {
        if (stopped[index]) {
            clearInterval(interval);
            reel.classList.remove("spinning");
            reel.classList.add("stopped");

            setTimeout(() => {
                reel.classList.remove("stopped");
            }, 350);

            return;
        }

        const symbolsInReel = reel.querySelectorAll(".symbol");

        symbolsInReel.forEach(symbol => {
            symbol.textContent = randomSymbol();
        });
    }, 40);
}

function spin() {
    if (!gameStarted || spinning) return;

    if (coin < 10) {
        message.textContent = "COINが足りません！";
        return;
    }

    coin -= bet;
    coinDisplay.textContent = coin;

    audioContext.resume();
    playSound(180, 0.15);

    spinning = true;
    spinButton.disabled = true;
    autoButton.disabled = false;

    document.querySelectorAll(".symbol").forEach(symbol => {
        symbol.classList.remove("win");
    });

    message.textContent = "STOPで止めよう！";

    stopped = [false, false, false];

    document.querySelectorAll(".stop-button").forEach(button => {
        button.disabled = false;
    });

    const reelElements = document.querySelectorAll(".reel");

    reelElements.forEach((reel, index) => {
        spinReel(reel, index);
    });
}

function stopReel(index) {
    if (!spinning || stopped[index]) return;

    stopped[index] = true;

    const button = document.querySelector(
        `.stop-button[data-index="${index}"]`
    );

    if (button) {
        button.disabled = true;
    }

    const reel = document.querySelectorAll(".reel")[index];

    reel.classList.add("stop");
    reel.classList.add("stopped");

    playSound(300 + index * 80, 0.1);

    setTimeout(() => {
        reel.classList.remove("stop");
        reel.classList.remove("stopped");
    }, 350);

    if (stopped.every(value => value)) {
        finishSpin();
    }
}

function finishSpin() {
    checkResult();

    spinning = false;
    spinButton.disabled = false;
    autoButton.disabled = true;

    document.querySelectorAll(".stop-button").forEach(button => {
        button.disabled = false;
    });
}

function autoStop() {
    if (!gameStarted || !spinning) return;

    autoButton.disabled = true;

    setTimeout(() => {
        if (spinning) stopReel(0);
    }, 600);

    setTimeout(() => {
        if (spinning) stopReel(1);
    }, 1200);

    setTimeout(() => {
        if (spinning) stopReel(2);
    }, 1800);
}

function successEffect() {
    const game = document.querySelector(".game");

    game.classList.remove("shake");
    void game.offsetWidth;
    game.classList.add("shake");

    for (let i = 0; i < 30; i++) {
        const spark = document.createElement("div");
        spark.className = "spark";

        spark.style.left = "50%";
        spark.style.top = "50%";

        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;

        spark.style.setProperty(
            "--x",
            `${Math.cos(angle) * distance}px`
        );

        spark.style.setProperty(
            "--y",
            `${Math.sin(angle) * distance}px`
        );

        document.body.appendChild(spark);

        setTimeout(() => {
            spark.remove();
        }, 800);
    }
}

function checkResult() {
    const scoreValues = {
        "🍒": 100,
        "🍀": 150,
        "⭐": 200,
        "🔥": 300,
        "💎": 500
    };

    const reelElements = document.querySelectorAll(".reel");
    const grid = [];

    for (let column = 0; column < 3; column++) {
        const symbolsInReel =
            reelElements[column].querySelectorAll(".symbol");

        grid[column] = [
            symbolsInReel[0].textContent,
            symbolsInReel[1].textContent,
            symbolsInReel[2].textContent
        ];
    }

    const lines = [
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[2, 0], [1, 1], [0, 2]]
    ];

    let gainedScore = 0;

    lines.forEach(line => {
        const [a, b, c] = line;

        const symbolA = grid[a[0]][a[1]];
        const symbolB = grid[b[0]][b[1]];
        const symbolC = grid[c[0]][c[1]];

        if (symbolA === symbolB && symbolB === symbolC) {
            gainedScore += scoreValues[symbolA];

            line.forEach(([column, row]) => {
                reelElements[column]
                    .querySelectorAll(".symbol")[row]
                    .classList.add("win");
            });
        }
    });

    if (gainedScore > 0) {
        coin += gainedScore;
        coinDisplay.textContent = coin;

        combo++;
        comboDisplay.textContent = combo;

        comboPopup.textContent = `COMBO ×${combo}`;

        comboPopup.classList.remove(
            "show",
            "combo-2",
            "combo-3",
            "combo-5"
        );

        if (combo >= 5) {
            comboPopup.classList.add("combo-5");

            const game = document.querySelector(".game");
            game.classList.remove("combo-shake");
            void game.offsetWidth;
            game.classList.add("combo-shake");
        } else if (combo >= 3) {
            comboPopup.classList.add("combo-3");
        } else if (combo >= 2) {
            comboPopup.classList.add("combo-2");
        }

        void comboPopup.offsetWidth;
        comboPopup.classList.add("show");

        score += gainedScore;
        scoreDisplay.textContent = score;

        message.textContent =
            `成功！ +${gainedScore} SCORE  COMBO ×${combo}`;

        successEffect();

        message.classList.remove("success");
        void message.offsetWidth;
        message.classList.add("success");

        const game = document.querySelector(".game");

        game.classList.remove("success-flash");
        void game.offsetWidth;
        game.classList.add("success-flash");
    } else {
        combo = 0;
        comboDisplay.textContent = combo;
        message.textContent = "もう一度チャレンジ！";
    }
}

function startGame() {
    if (gameStarted) return;

    gameStarted = true;
    spinButton.disabled = false;
    startButton.disabled = true;

    message.textContent = "ゲーム開始！SPINしてみよう！";

    audioContext.resume();
    playSound(500, 0.15);
}

function resetGame() {
    score = 0;
    combo = 0;
    coin = 1000;
    spinning = false;
    gameStarted = false;
    stopped = [false, false, false];

    scoreDisplay.textContent = score;
    comboDisplay.textContent = combo;
    coinDisplay.textContent = coin;

    spinButton.disabled = true;
    autoButton.disabled = true;
    startButton.disabled = false;

    document.querySelectorAll(".stop-button").forEach(button => {
        button.disabled = false;
    });

    comboPopup.classList.remove(
        "show",
        "combo-2",
        "combo-3",
        "combo-5"
    );

    message.textContent = "STARTを押してください";

    createReels();
}

function toggleInfo() {
    infoPanel.classList.toggle("show");
}

createReels();

spinButton.disabled = true;
autoButton.disabled = true;

startButton.addEventListener("click", startGame);
spinButton.addEventListener("click", spin);
autoButton.addEventListener("click", autoStop);
resetButton.addEventListener("click", resetGame);
infoButton.addEventListener("click", toggleInfo);

document.querySelectorAll(".stop-button").forEach(button => {
    button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        stopReel(index);
    });
});

betDisplay.addEventListener("click", () => {
    if (bet === 10) {
        bet = 20;
    } else if (bet === 20) {
        bet = 30;
    } else if (bet === 30) {
        bet = 40;
    } else if (bet === 40) {
        bet = 50;
    } else {
        bet = 10;
    }

    betValue.textContent = bet;
});