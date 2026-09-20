const betDisplay = document.getElementById("betDisplay");
const betValue = document.getElementById("bet");

const reels = document.getElementById("reels");
const scoreDisplay = document.getElementById("score");
const coinDisplay = document.getElementById("coin");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const infoButton = document.getElementById("infoButton");
const infoPanel = document.getElementById("infoPanel");

let audioContext = null;

let bet = 10;
let score = 0;
let coin = 1000;

let spinning = false;
let stopped = [false, false, false];
let resultFinished = false;

let reelData = [];
let animationFrames = [null, null, null];

const betSettings = {
    10: {
        speed: 800,
        glow: false,
        shake: false,
        flash: false
    },
    20: {
        speed: 700,
        glow: true,
        shake: false,
        flash: false
    },
    30: {
        speed: 600,
        glow: true,
        shake: true,
        flash: false
    },
    40: {
        speed: 500,
        glow: true,
        shake: true,
        flash: true
    },
    50: {
        speed: 400,
        glow: true,
        shake: true,
        flash: true
    }
};

const SYMBOL_COUNT = 20;

const reelSymbols = [
    [
        "🍒","🍋","🔔","🍒","🍉","🍋","BAR","🍒","🔔","🍋",
        "🍉","🍒","7️⃣","🍋","🔔","🍒","🍉","🍋","BAR","🍒"
    ],
    [
        "🍋","🍒","🔔","🍉","🍒","🍋","BAR","🍒","🍉","🔔",
        "🍋","🍒","7️⃣","🍉","🍋","🔔","🍒","🍉","🍋","🍒"
    ],
    [
        "🍒","🍉","🍋","🔔","🍒","🍋","BAR","🍉","🍒","🔔",
        "🍋","🍒","7️⃣","🍉","🍋","🍒","🔔","🍋","🍉","🍒"
    ]
];

const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 4, 8],
    [6, 4, 2]
];

const scoreValues = {
    "7️⃣": 100,
    "BAR": 60,
    "🔔": 40,
    "🍉": 30,
    "🍒": 20
};

const resultNames = {
    "7️⃣": "7",
    "BAR": "BAR",
    "🔔": "BELL",
    "🍉": "WATERMELON",
    "🍋": "LEMON",
    "🍒": "CHERRY"
};

function copyArray(array) {
    return [...array];
}

function createReels() {
    reels.innerHTML = "";
    reelData = [];

    for (let i = 0; i < 3; i++) {
        const reel = document.createElement("div");
        reel.className = "reel";

        const strip = document.createElement("div");
        strip.className = "reel-strip";

        const symbols = [];

        const base = copyArray(reelSymbols[i]);

        for (let repeat = 0; repeat < 3; repeat++) {
            symbols.push(...base);
        }

        symbols.forEach(symbol => {
            const item = document.createElement("div");
            item.className = "symbol";
            item.textContent = symbol;
            strip.appendChild(item);
        });

        reel.appendChild(strip);
        reels.appendChild(reel);

        reelData.push({
            reel,
            strip,
            symbols,
            position: SYMBOL_COUNT,
            targetPosition: SYMBOL_COUNT,
            stopping: false
        });
    }
}

function getCurrentSymbols() {
    return reelData.map(data => {
        const index =
            Math.round(data.position) % SYMBOL_COUNT;

        return data.symbols[index + SYMBOL_COUNT];
    });
}

function updateReel(index) {
    const data = reelData[index];

    data.strip.style.transform =
        `translate3d(0, ${-data.position * 80}px, 0)`;
}

function spinReel(index) {
    const data = reelData[index];

    if (stopped[index]) {
        return;
    }

    const settings = betSettings[bet];

    const speed = 80 / settings.speed * 16.67;

    data.position += speed;

    if (data.position >= SYMBOL_COUNT * 2) {
        data.position -= SYMBOL_COUNT;
    }

    updateReel(index);

    animationFrames[index] =
        requestAnimationFrame(() => spinReel(index));
}

function stopReel(index) {
    if (!spinning || stopped[index]) {
        return;
    }

    stopped[index] = true;

    if (animationFrames[index]) {
        cancelAnimationFrame(animationFrames[index]);
        animationFrames[index] = null;
    }

    const data = reelData[index];

    const nearest =
        Math.round(data.position);

    data.position = nearest;

    data.strip.style.transition =
        "transform 0.22s cubic-bezier(.2,.8,.2,1)";

    updateReel(index);

    setTimeout(() => {
        data.strip.style.transition = "";

        if (stopped.every(value => value)) {
            finishSpin();
        }
    }, 230);
}

function playSound(type) {
    if (!audioContext) {
        audioContext =
            new (window.AudioContext ||
            window.webkitAudioContext)();
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (type === "spin") {
        oscillator.frequency.value = 180;
        gain.gain.value = 0.04;
    }

    if (type === "stop") {
        oscillator.frequency.value = 320;
        gain.gain.value = 0.08;
    }

    if (type === "win") {
        oscillator.frequency.value = 700;
        gain.gain.value = 0.12;
    }

    if (type === "bonus") {
        oscillator.frequency.value = 1000;
        gain.gain.value = 0.15;
    }

    oscillator.type = "square";

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.18
    );

    oscillator.stop(
        audioContext.currentTime + 0.18
    );
}

function applyBetEffect() {
    const settings = betSettings[bet];

    reels.classList.remove(
        "bet-glow",
        "bet-shake",
        "bet-flash"
    );

    if (settings.glow) {
        reels.classList.add("bet-glow");
    }

    if (settings.shake) {
        reels.classList.add("bet-shake");
    }

    if (settings.flash) {
        reels.classList.add("bet-flash");
    }
}

function spin() {
    if (spinning) {
        return;
    }

    if (coin < bet) {
        message.textContent = "COINが足りません！";
        return;
    }

    spinning = true;
    stopped = [false, false, false];
    resultFinished = false;

    coin -= bet;

    coinDisplay.textContent = coin;

    message.textContent =
        `BET ${bet}｜3つのSTOPで止めよう！`;

    reels.classList.remove(
        "success-shake",
        "success-glow",
        "flash"
    );

    applyBetEffect();

    playSound("spin");

    for (let i = 0; i < 3; i++) {
        reelData[i].strip.style.transition = "";

        const randomStart =
            Math.floor(Math.random() * SYMBOL_COUNT);

        reelData[i].position =
            SYMBOL_COUNT + randomStart;

        updateReel(i);

        spinReel(i);
    }
}

function finishSpin() {
    if (resultFinished) {
        return;
    }

    resultFinished = true;
    spinning = false;

    checkResult();
}

function checkResult() {
    const symbols = getCurrentSymbols();

    let totalScore = 0;
    let bonus = false;
    let winningLines = [];

    lines.forEach((line, index) => {
        const values = line.map(position => {
            const reelIndex = position % 3;
            return symbols[reelIndex];
        });

        if (
            values[0] === values[1] &&
            values[1] === values[2]
        ) {
            if (values[0] === "🍋") {
                bonus = true;
                winningLines.push(index);
                return;
            }

            if (scoreValues[values[0]]) {
                totalScore += scoreValues[values[0]];
                winningLines.push(index);
            }
        }
    });

    if (bonus) {
        const bonusScore = 50;

        score += bonusScore;
        coin += bonusScore;

        scoreDisplay.textContent = score;
        coinDisplay.textContent = coin;

        message.textContent =
            "🍋 BONUS！ +50 SCORE";

        playSound("bonus");

        successEffect(winningLines);

        return;
    }

    if (totalScore > 0) {
        score += totalScore;
        coin += totalScore;

        scoreDisplay.textContent = score;
        coinDisplay.textContent = coin;

        message.textContent =
            `🎉 ${totalScore} SCORE GET！`;

        playSound("win");

        successEffect(winningLines);

        return;
    }

    message.textContent = "MISS...";

    playSound("stop");

    reels.classList.remove(
        "bet-glow",
        "bet-shake",
        "bet-flash"
    );
}

function highlightLine(lineIndex) {
    const line = lines[lineIndex];

    line.forEach(position => {
        const reelIndex = position % 3;

        const reel = reelData[reelIndex].reel;

        reel.classList.add("winning");

        setTimeout(() => {
            reel.classList.remove("winning");
        }, 700);
    });
}

function successEffect(winningLines) {
    reels.classList.add("success-shake");
    reels.classList.add("success-glow");

    const settings = betSettings[bet];

    if (settings.flash) {
        reels.classList.add("flash");
    }

    winningLines.forEach((lineIndex, i) => {
        setTimeout(() => {
            highlightLine(lineIndex);
        }, i * 120);
    });

    setTimeout(() => {
        reels.classList.remove(
            "success-shake",
            "success-glow",
            "flash",
            "bet-glow",
            "bet-shake",
            "bet-flash"
        );
    }, 900);
}

betDisplay.addEventListener("click", () => {
    if (spinning) {
        return;
    }

    const values = [10, 20, 30, 40, 50];

    const currentIndex =
        values.indexOf(bet);

    const nextIndex =
        (currentIndex + 1) % values.length;

    bet = values[nextIndex];

    betValue.textContent = bet;

    message.textContent =
        `BET ${bet}｜${betSettings[bet].speed}ms`;
});

spinButton.addEventListener("click", spin);

document.querySelectorAll(".stop-button").forEach(button => {
    button.addEventListener("click", () => {
        const index =
            Number(button.dataset.index);

        stopReel(index);

        if (spinning) {
            playSound("stop");
        }
    });
});

infoButton.addEventListener("click", () => {
    infoPanel.classList.toggle("show");
});

createReels();