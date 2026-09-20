const reels = document.getElementById("reels");
const scoreDisplay = document.getElementById("score");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");

let audioContext = null;
let score = 0;

let spinning = false;
let stopped = [false, false, false];
let resultFinished = false;

let reelData = [];
let animationFrames = [null, null, null];

const SPIN_SPEED =
    window.innerWidth <= 700
        ? 600
        : 800;

const SYMBOL_COUNT = 20;

const CHERRY = String.fromCodePoint(0x1F352);
const LEMON = String.fromCodePoint(0x1F34B);
const BELL = String.fromCodePoint(0x1F514);
const WATERMELON = String.fromCodePoint(0x1F349);
const SEVEN = "7\uFE0F\u20E3";

const reelSymbols = [
    [
        CHERRY,
        LEMON,
        BELL,
        CHERRY,
        WATERMELON,
        LEMON,
        CHERRY,
        "BAR",
        LEMON,
        WATERMELON,
        CHERRY,
        LEMON,
        WATERMELON,
        BELL,
        CHERRY,
        LEMON,
        WATERMELON,
        CHERRY,
        LEMON,
        SEVEN
    ],
    [
        LEMON,
        CHERRY,
        BELL,
        WATERMELON,
        CHERRY,
        LEMON,
        CHERRY,
        "BAR",
        WATERMELON,
        BELL,
        LEMON,
        CHERRY,
        SEVEN,
        WATERMELON,
        LEMON,
        BELL,
        CHERRY,
        WATERMELON,
        LEMON,
        CHERRY
    ],
    [
        CHERRY,
        WATERMELON,
        LEMON,
        BELL,
        CHERRY,
        LEMON,
        "BAR",
        WATERMELON,
        CHERRY,
        BELL,
        LEMON,
        CHERRY,
        SEVEN,
        WATERMELON,
        LEMON,
        CHERRY,
        BELL,
        LEMON,
        WATERMELON,
        CHERRY
    ]
];

function playSound(frequency, duration, type = "square") {
    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    audioContext.resume();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gain.gain.setValueAtTime(
        0.08,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );
}

function playWinSound() {
    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    audioContext.resume();

    const notes = [
        523,
        659,
        784,
        1046
    ];

    notes.forEach((frequency, index) => {
        setTimeout(() => {
            playSound(
                frequency,
                0.18,
                "square"
            );
        }, index * 90);
    });
}

function createReels() {
    reels.innerHTML = "";

    for (
        let column = 0;
        column < 3;
        column++
    ) {
        const reel =
            document.createElement("div");

        reel.className = "reel";

        const track =
            document.createElement("div");

        track.className = "reel-track";

        for (
            let repeat = 0;
            repeat < 3;
            repeat++
        ) {
            reelSymbols[column].forEach(
                symbolText => {
                    const symbol =
                        document.createElement("div");

                    symbol.className = "symbol";
                    symbol.textContent = symbolText;

                    track.appendChild(symbol);
                }
            );
        }

        reel.appendChild(track);
        reels.appendChild(reel);
    }

    requestAnimationFrame(() => {
        document
            .querySelectorAll(".reel")
            .forEach(reel => {

                const symbolHeight =
                    reel.clientHeight / 3;

                reel
                    .querySelectorAll(".symbol")
                    .forEach(symbol => {
                        symbol.style.height =
                            `${symbolHeight}px`;

                        symbol.style.minHeight =
                            `${symbolHeight}px`;
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
            `translate3d(0, -${startPosition}px, 0)`;

        track.style.filter = "blur(0)";
    });
}

function getCurrentSymbols(index) {
    const data = reelData[index];

    const symbolsInTrack =
        data.track.querySelectorAll(".symbol");

    const currentIndex =
        Math.round(
            data.position /
            data.symbolHeight
        ) % SYMBOL_COUNT;

    const topIndex =
        currentIndex;

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
    if (
        !spinning ||
        stopped[index]
    ) {
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

    if (
        data.position >=
        loopDistance
    ) {
        data.position -=
            loopDistance;
    }

    data.track.style.transform =
        `translate3d(0, -${data.position}px, 0)`;

    data.track.style.filter =
        "blur(2px)";

    animationFrames[index] =
        requestAnimationFrame(time => {
            updateReel(index, time);
        });
}

function stopReel(index) {
    if (
        !spinning ||
        stopped[index]
    ) {
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

    data.track.style.filter = "blur(0)";

    if (
        animationFrames[index] !== null
    ) {
        cancelAnimationFrame(
            animationFrames[index]
        );

        animationFrames[index] = null;
    }

    const snappedPosition =
        Math.round(
            data.position /
            data.symbolHeight
        ) * data.symbolHeight;

    const loopDistance =
        SYMBOL_COUNT *
        data.symbolHeight;

    data.position =
        snappedPosition %
        loopDistance;

    data.track.style.transition =
        "transform 0.22s cubic-bezier(0.15, 0.75, 0.25, 1)";

    data.track.style.transform =
        `translate3d(0, -${data.position}px, 0)`;

    playSound(
        280 + index * 80,
        0.1
    );

    setTimeout(() => {

        data.track.style.transition = "";

        data.reel.classList.add("stopped");

        setTimeout(() => {
            data.reel.classList.remove("stopped");
        }, 350);

        if (
            stopped.every(
                value => value
            )
        ) {
            finishSpin();
        }

    }, 230);
}

function spin() {
    if (spinning) {
        return;
    }

    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    audioContext.resume();

    playSound(180, 0.15);

    spinning = true;
    resultFinished = false;

    spinButton.disabled = true;

    document
        .querySelectorAll(".symbol")
        .forEach(symbol => {
            symbol.classList.remove("win");
        });

    message.textContent =
        "\u0053\u0054\u004f\u0050\u3067\u6b62\u3081\u3088\u3046\uff01";

    stopped = [
        false,
        false,
        false
    ];

    setupReels();

    requestAnimationFrame(() => {

        document
            .querySelectorAll(".stop-button")
            .forEach(button => {
                button.disabled = false;
            });

        for (
            let i = 0;
            i < 3;
            i++
        ) {
            spinReel(i);
        }
    });
}

function finishSpin() {
    if (resultFinished) {
        return;
    }

    resultFinished = true;

    const grid = [];

    for (
        let column = 0;
        column < 3;
        column++
    ) {
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

function highlightLine(line) {
    line.forEach(([column, row]) => {

        const data = reelData[column];

        const symbolsInReel =
            data.track.querySelectorAll(".symbol");

        const currentIndex =
            Math.round(
                data.position /
                data.symbolHeight
            ) % SYMBOL_COUNT;

        const actualIndex =
            currentIndex + row;

        const symbol =
            symbolsInReel[actualIndex];

        if (symbol) {
            symbol.classList.add("win");
        }
    });
}

function successEffect() {
    const game =
        document.querySelector(".game");

    game.classList.remove("shake");

    void game.offsetWidth;

    game.classList.add("shake");

    game.classList.remove("success-flash");

    void game.offsetWidth;

    game.classList.add("success-flash");

    for (
        let i = 0;
        i < 35;
        i++
    ) {
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
        [SEVEN]: 500,
        BAR: 300,
        [BELL]: 200,
        [WATERMELON]: 150,
        [CHERRY]: 100
    };

    const resultNames = {
        [SEVEN]: "\u5927\u5f53\u305f\u308a\uff01",
        BAR: "\u4e2d\u5f53\u305f\u308a\uff01",
        [BELL]: "\u5c0f\u5f53\u305f\u308a\uff01",
        [WATERMELON]: "\u5c0f\u5f53\u305f\u308a\uff01",
        [CHERRY]: "\u5f53\u305f\u308a\uff01"
    };

    const lines = [
        [
            [0, 0],
            [1, 0],
            [2, 0]
        ],
        [
            [0, 1],
            [1, 1],
            [2, 1]
        ],
        [
            [0, 2],
            [1, 2],
            [2, 2]
        ],
        [
            [0, 0],
            [1, 1],
            [2, 2]
        ],
        [
            [2, 0],
            [1, 1],
            [0, 2]
        ]
    ];

    let baseScore = 0;
    let bonus = false;
    let resultText = "";

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

            highlightLine(line);

            if (
                symbolA === LEMON
            ) {
                bonus = true;
                return;
            }

            if (
                scoreValues[symbolA]
            ) {
                baseScore +=
                    scoreValues[symbolA];

                resultText =
                    resultNames[symbolA];
            }
        }
    });

    if (bonus) {

        const bonusScore = 250;

        score += bonusScore;

        scoreDisplay.textContent =
            score;

        message.textContent =
            `${LEMON} BONUS! +${bonusScore} SCORE`;

        playWinSound();

        successEffect();

        return;
    }

    if (baseScore > 0) {

        score += baseScore;

        scoreDisplay.textContent =
            score;

        message.textContent =
            `${resultText} +${baseScore} SCORE`;

        playWinSound();

        successEffect();

        return;
    }

    message.textContent =
        "\u3082\u3046\u4e00\u5ea6\u30c1\u30e3\u30ec\u30f3\u30b8\uff01";

    playSound(
        160,
        0.12,
        "triangle"
    );
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