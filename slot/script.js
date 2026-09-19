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

let reelData = [];
let animationFrames = [null, null, null];

const SPIN_SPEED = 800;
const SYMBOL_COUNT = 30;

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

        reel.style.overflow = "hidden";
        reel.style.position = "relative";

        const track = document.createElement("div");

        track.className = "reel-track";

        track.style.position = "absolute";
        track.style.left = "0";
        track.style.top = "0";
        track.style.width = "100%";
        track.style.display = "flex";
        track.style.flexDirection = "column";
        track.style.willChange = "transform";

        const reelSymbols = [];

        for (let i = 0; i < SYMBOL_COUNT; i++) {
            reelSymbols.push(randomSymbol());
        }

        for (let repeat = 0; repeat < 3; repeat++) {
            reelSymbols.forEach(symbolText => {
                const symbol = document.createElement("div");

                symbol.className = "symbol";
                symbol.textContent = symbolText;

                symbol.style.display = "flex";
                symbol.style.alignItems = "center";
                symbol.style.justifyContent = "center";

                track.appendChild(symbol);
            });
        }

        reel.appendChild(track);
        reels.appendChild(reel);
    }

    requestAnimationFrame(() => {
        document.querySelectorAll(".reel").forEach(reel => {
            const symbolHeight = reel.clientHeight / 3;

            reel.querySelectorAll(".symbol").forEach(symbol => {
                symbol.style.height = `${symbolHeight}px`;
                symbol.style.minHeight = `${symbolHeight}px`;
            });
        });
    });
}

function setupReels() {
    reelData = [];

    const reelElements =
        document.querySelectorAll(".reel");

    reelElements.forEach((reel, index) => {
        const track =
            reel.querySelector(".reel-track");

        const symbolHeight =
            reel.clientHeight / 3;

        const startIndex =
            Math.floor(
                Math.random() * SYMBOL_COUNT
            );

        const startPosition =
            startIndex * symbolHeight;

        reelData[index] = {
            reel: reel,
            track: track,
            position: startPosition,
            lastTime: null,
            symbolHeight: symbolHeight
        };

        track.style.transition = "";

        track.style.transform =
            `translateY(-${startPosition}px)`;
    });
}

function getCurrentSymbols(index) {
    const data = reelData[index];

    const symbolsInTrack =
        data.track.querySelectorAll(".symbol");

    const symbolHeight =
        data.symbolHeight;

    const currentIndex =
        Math.round(
            Math.abs(data.position) /
            symbolHeight
        );

    const topIndex =
        currentIndex %
        SYMBOL_COUNT;

    const middleIndex =
        (currentIndex + 1) %
        SYMBOL_COUNT;

    const bottomIndex =
        (currentIndex + 2) %
        SYMBOL_COUNT;

    return [
        symbolsInTrack[topIndex].textContent,
        symbolsInTrack[middleIndex].textContent,
        symbolsInTrack[bottomIndex].textContent
    ];
}

function spinReel(index) {
    const data = reelData[index];

    data.lastTime = null;

    animationFrames[index] =
        requestAnimationFrame(time => {
            updateReel(index, time);
        });
}

function updateReel(index, timestamp) {
    if (!spinning || stopped[index]) {
        return;
    }

    const data = reelData[index];

    if (data.lastTime === null) {
        data.lastTime = timestamp;
    }

    const delta =
        (timestamp - data.lastTime) / 1000;

    data.lastTime = timestamp;

    data.position +=
        SPIN_SPEED * delta;

    const loopDistance =
        SYMBOL_COUNT *
        data.symbolHeight;

    if (data.position >= loopDistance) {
        data.position -= loopDistance;
    }

    data.track.style.transform =
        `translate3d(0, -${data.position}px, 0)`;

    animationFrames[index] =
        requestAnimationFrame(time => {
            updateReel(index, time);
        });
}

function stopReel(index) {
    if (!spinning || stopped[index]) {
        return;
    }

    stopped[index] = true;

    const button =
        document.querySelector(
            `.stop-button[data-index="${index}"]`
        );

    if (button) {
        button.disabled = true;
    }

    const data = reelData[index];

    if (animationFrames[index] !== null) {
        cancelAnimationFrame(
            animationFrames[index]
        );

        animationFrames[index] = null;
    }

    const currentPosition =
        data.position;

    const snappedPosition =
        Math.round(
            currentPosition /
            data.symbolHeight
        ) * data.symbolHeight;

    const loopDistance =
        SYMBOL_COUNT *
        data.symbolHeight;

    data.position =
        snappedPosition % loopDistance;

    data.track.style.transition =
        "transform 0.22s cubic-bezier(0.15, 0.75, 0.25, 1)";

    data.track.style.transform =
        `translate3d(0, -${data.position}px, 0)`;

    playSound(
        300 + index * 80,
        0.1
    );

    setTimeout(() => {
        data.track.style.transition = "";

        const reel = data.reel;

        reel.classList.add("stopped");

        setTimeout(() => {
            reel.classList.remove("stopped");
        }, 350);

        if (stopped.every(value => value)) {
            finishSpin();
        }
    }, 230);
}

function spin() {
    if (spinning) {
        return;
    }

    if (coin < bet) {
        message.textContent =
            "COINが足りません！";

        return;
    }

    coin -= bet;
    coinDisplay.textContent = coin;

    audioContext.resume();

    playSound(180, 0.15);

    spinning = true;

    spinButton.disabled = true;

    document
        .querySelectorAll(".symbol")
        .forEach(symbol => {
            symbol.classList.remove("win");
        });

    comboPopup.classList.remove(
        "show",
        "combo-2",
        "combo-3",
        "combo-5"
    );

    message.textContent =
        "STOPで止めよう！";

    stopped = [
        false,
        false,
        false
    ];

    setupReels();

    document
        .querySelectorAll(".stop-button")
        .forEach(button => {
            button.disabled = false;
        });

    for (let i = 0; i < 3; i++) {
        spinReel(i);
    }
}

function finishSpin() {
    const grid = [];

    for (let column = 0; column < 3; column++) {
        grid[column] =
            getCurrentSymbols(column);
    }

    checkResult(grid);

    spinning = false;

    spinButton.disabled = false;

    document
        .querySelectorAll(".stop-button")
        .forEach(button => {
            button.disabled = false;
        });
}

function successEffect() {
    const game =
        document.querySelector(".game");

    game.classList.remove("shake");

    void game.offsetWidth;

    game.classList.add("shake");

    for (let i = 0; i < 30; i++) {
        const spark =
            document.createElement("div");

        spark.className = "spark";

        spark.style.left = "50%";
        spark.style.top = "50%";

        const angle =
            Math.random() *
            Math.PI *
            2;

        const distance =
            100 +
            Math.random() *
            300;

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

function checkResult(grid) {
    const scoreValues = {
        "🍒": 100,
        "🍀": 150,
        "⭐": 200,
        "🔥": 300,
        "💎": 500
    };

    const reelElements =
        document.querySelectorAll(".reel");

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

        const symbolA =
            grid[a[0]][a[1]];

        const symbolB =
            grid[b[0]][b[1]];

        const symbolC =
            grid[c[0]][c[1]];

        if (
            symbolA === symbolB &&
            symbolB === symbolC
        ) {
            baseScore +=
                scoreValues[symbolA];

            line.forEach(
                ([column, row]) => {
                    const data =
                        reelData[column];

                    const symbolsInReel =
                        data.track
                            .querySelectorAll(
                                ".symbol"
                            );

                    const currentIndex =
                        Math.round(
                            Math.abs(
                                data.position
                            ) /
                            data.symbolHeight
                        ) %
                        SYMBOL_COUNT;

                    const actualIndex =
                        currentIndex + row;

                    symbolsInReel[
                        actualIndex
                    ].classList.add("win");
                }
            );
        }
    });

    if (baseScore > 0) {
        combo++;

        comboDisplay.textContent =
            combo;

        const gainedScore =
            baseScore * combo;

        coin += gainedScore;

        coinDisplay.textContent =
            coin;

        score += gainedScore;

        scoreDisplay.textContent =
            score;

        comboPopup.textContent =
            `COMBO ×${combo}`;

        comboPopup.classList.remove(
            "show",
            "combo-2",
            "combo-3",
            "combo-5"
        );

        if (combo >= 5) {
            comboPopup.classList.add(
                "combo-5"
            );

            const game =
                document.querySelector(
                    ".game"
                );

            game.classList.remove(
                "combo-shake"
            );

            void game.offsetWidth;

            game.classList.add(
                "combo-shake"
            );

        } else if (combo >= 3) {
            comboPopup.classList.add(
                "combo-3"
            );

        } else if (combo >= 2) {
            comboPopup.classList.add(
                "combo-2"
            );
        }

        void comboPopup.offsetWidth;

        comboPopup.classList.add(
            "show"
        );

        message.textContent =
            `成功！ +${gainedScore} SCORE（基本${baseScore} × COMBO${combo}）`;

        successEffect();

        message.classList.remove(
            "success"
        );

        void message.offsetWidth;

        message.classList.add(
            "success"
        );

        const game =
            document.querySelector(
                ".game"
            );

        game.classList.remove(
            "success-flash"
        );

        void game.offsetWidth;

        game.classList.add(
            "success-flash"
        );

    } else {
        combo = 0;

        comboDisplay.textContent =
            combo;

        message.textContent =
            "もう一度チャレンジ！";
    }
}

function toggleInfo() {
    const infoPanel =
        document.getElementById(
            "infoPanel"
        );

    if (infoPanel) {
        infoPanel.classList.toggle(
            "show"
        );
    }
}

createReels();

spinButton.disabled = false;

spinButton.addEventListener(
    "click",
    spin
);

document
    .querySelectorAll(".stop-button")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
                const index =
                    Number(
                        button.dataset.index
                    );

                stopReel(index);
            }
        );
    });

betDisplay.addEventListener(
    "click",
    () => {
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
    }
);