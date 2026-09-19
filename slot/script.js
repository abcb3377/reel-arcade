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
    "🍒"
];

const reels = document.getElementById("reels");
const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");
const coinDisplay = document.getElementById("coin");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const comboPopup = document.getElementById("comboPopup");

let bet = 10;
let score = 0;
let combo = 0;
let coin = 1000;

let spinning = false;
let stopped = [false, false, false];

let targetSymbol = "";
let reelIntervals = [null, null, null];
let targetTimes = [0, 0, 0];
let reelPositions = [0, 0, 0];

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

function updateReel(reel, index) {
    const symbolsInReel = reel.querySelectorAll(".symbol");

    const top = symbolsInReel[0].textContent;
    const middle = symbolsInReel[1].textContent;
    const bottom = symbolsInReel[2].textContent;

    symbolsInReel[0].textContent = bottom;
    symbolsInReel[1].textContent = top;
    symbolsInReel[2].textContent = randomSymbol();

    reelPositions[index]++;

    if (symbolsInReel[1].textContent === targetSymbol) {
        targetTimes[index] = performance.now();

        playSound(500 + index * 80, 0.04);
    }
}

function spinReel(reel, index) {
    reel.classList.add("spinning");

    const speed = 55 + index * 10;

    reelIntervals[index] = setInterval(() => {
        if (stopped[index]) {
            clearInterval(reelIntervals[index]);
            reelIntervals[index] = null;

            reel.classList.remove("spinning");
            reel.classList.add("stopped");

            setTimeout(() => {
                reel.classList.remove("stopped");
            }, 350);

            return;
        }

        updateReel(reel, index);

    }, speed);
}

function spin() {
    if (spinning) return;

    if (coin < bet) {
        message.textContent = "COINが足りません！";
        return;
    }

    coin -= bet;
    coinDisplay.textContent = coin;

    audioContext.resume();

    playSound(180, 0.15);

    spinning = true;
    spinButton.disabled = true;

    document.querySelectorAll(".symbol").forEach(symbol => {
        symbol.classList.remove("win");
    });

    comboPopup.classList.remove(
        "show",
        "combo-2",
        "combo-3",
        "combo-5"
    );

    targetSymbol =
        symbols[Math.floor(Math.random() * symbols.length)];

    message.textContent = `狙い：${targetSymbol}`;

    stopped = [false, false, false];
    targetTimes = [0, 0, 0];
    reelPositions = [0, 0, 0];

    document.querySelectorAll(".stop-button").forEach(button => {
        button.disabled = false;
    });

    const reelElements = document.querySelectorAll(".reel");

    reelElements.forEach((reel, index) => {
        spinReel(reel, index);
    });
}

function getTimingResult(index) {
    const reel = document.querySelectorAll(".reel")[index];

    if (!reel) {
        return {
            result: "MISS",
            bonus: 0
        };
    }

    const symbolsInReel = reel.querySelectorAll(".symbol");
    const centerSymbol = symbolsInReel[1].textContent;

    if (centerSymbol !== targetSymbol) {
        return {
            result: "MISS",
            bonus: 0
        };
    }

    const elapsed = performance.now() - targetTimes[index];

    if (elapsed <= 90) {
        return {
            result: "PERFECT",
            bonus: 100
        };
    }

    if (elapsed <= 180) {
        return {
            result: "GOOD",
            bonus: 50
        };
    }

    return {
        result: "MISS",
        bonus: 0
    };
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

    const timing = getTimingResult(index);

    reel.dataset.timing = timing.result;
    reel.dataset.bonus = timing.bonus;

    reel.classList.add("stop");
    reel.classList.add("stopped");

    if (timing.result === "PERFECT") {
        playSound(900, 0.12);
    } else if (timing.result === "GOOD") {
        playSound(650, 0.1);
    } else {
        playSound(250, 0.1);
    }

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

    const reelElements = document.querySelectorAll(".reel");

    let perfectCount = 0;
    let goodCount = 0;

    reelElements.forEach(reel => {
        if (reel.dataset.timing === "PERFECT") {
            perfectCount++;
        }

        if (reel.dataset.timing === "GOOD") {
            goodCount++;
        }
    });

    let timingBonus = 0;

    reelElements.forEach(reel => {
        timingBonus += Number(reel.dataset.bonus || 0);
    });

    if (timingBonus > 0) {
        score += timingBonus;
        scoreDisplay.textContent = score;

        coin += timingBonus;
        coinDisplay.textContent = coin;
    }

    if (perfectCount === 3) {
        message.textContent += "　🔥 ALL PERFECT！";
        successEffect();
    } else if (perfectCount >= 1) {
        message.textContent += `　PERFECT ×${perfectCount}`;
    } else if (goodCount >= 1) {
        message.textContent += `　GOOD ×${goodCount}`;
    }

    if (timingBonus > 0) {
        message.textContent += `　目押しBONUS +${timingBonus}`;
    }

    spinning = false;

    spinButton.disabled = false;

    document.querySelectorAll(".stop-button").forEach(button => {
        button.disabled = false;
    });
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

    let baseScore = 0;

    lines.forEach(line => {
        const [a, b, c] = line;

        const symbolA = grid[a[0]][a[1]];
        const symbolB = grid[b[0]][b[1]];
        const symbolC = grid[c[0]][c[1]];

        if (
            symbolA === symbolB &&
            symbolB === symbolC
        ) {
            baseScore += scoreValues[symbolA];

            line.forEach(([column, row]) => {
                reelElements[column]
                    .querySelectorAll(".symbol")[row]
                    .classList.add("win");
            });
        }
    });

    if (baseScore > 0) {
        combo++;
        comboDisplay.textContent = combo;

        const gainedScore = baseScore * combo;

        coin += gainedScore;
        coinDisplay.textContent = coin;

        score += gainedScore;
        scoreDisplay.textContent = score;

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

        message.textContent =
            `成功！ +${gainedScore} SCORE（基本${baseScore} × COMBO${combo}）`;

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

function toggleInfo() {
    const infoPanel = document.getElementById("infoPanel");

    if (infoPanel) {
        infoPanel.classList.toggle("show");
    }
}

createReels();

spinButton.disabled = false;

spinButton.addEventListener("click", spin);

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