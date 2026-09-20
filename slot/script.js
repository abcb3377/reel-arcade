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

const SPIN_SPEED =
    window.innerWidth <= 700
        ? 600
        : 800;

const SYMBOL_COUNT = 20;

const reelSymbols = [
    [
        "🍒",
        "🍋",
        "🔔",
        "🍒",
        "🍉",
        "🍋",
        "BAR",
        "🍒",
        "🔔",
        "🍋",
        "🍉",
        "🍒",
        "7️⃣",
        "🍋",
        "🔔",
        "🍒",
        "🍉",
        "🍋",
        "BAR",
        "🍒"
    ],

    [
        "🍋",
        "🍒",
        "🔔",
        "🍉",
        "🍒",
        "🍋",
        "BAR",
        "🍒",
        "🍉",
        "🔔",
        "🍋",
        "🍒",
        "7️⃣",
        "🍉",
        "🍋",
        "🔔",
        "🍒",
        "🍉",
        "🍋",
        "🍒"
    ],

    [
        "🍒",
        "🍉",
        "🍋",
        "🔔",
        "🍒",
        "🍋",
        "BAR",
        "🍉",
        "🍒",
        "🔔",
        "🍋",
        "🍒",
        "7️⃣",
        "🍉",
        "🍋",
        "🍒",
        "🔔",
        "🍋",
        "🍉",
        "🍒"
    ]
];

function playSound(
    frequency,
    duration,
    type = "square"
) {
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

    oscillator.frequency.value =
        frequency;

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
        audioContext.currentTime +
        duration
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

    notes.forEach(
        (frequency, index) => {
            setTimeout(() => {
                playSound(
                    frequency,
                    0.18,
                    "square"
                );
            }, index * 90);
        }
    );
}

function shuffleCopy(array) {
    return [...array];
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

        const fixedSymbols =
            shuffleCopy(
                reelSymbols[column]
            );

        for (
            let repeat = 0;
            repeat < 3;
            repeat++
        ) {
            fixedSymbols.forEach(
                symbolText => {
                    const symbol =
                        document.createElement(
                            "div"
                        );

                    symbol.className =
                        "symbol";

                    symbol.textContent =
                        symbolText;

                    track.appendChild(
                        symbol
                    );
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

    reelElements.forEach(
        (reel, index) => {
            const track =
                reel.querySelector(
                    ".reel-track"
                );

            const symbolHeight =
                reel.clientHeight / 3;

            const startIndex =
                Math.floor(
                    Math.random() *
                    SYMBOL_COUNT
                );

            const startPosition =
                startIndex *
                symbolHeight;

            reelData[index] = {
                reel: reel,
                track: track,
                position: startPosition,
                lastTime: null,
                symbolHeight:
                    symbolHeight
            };

            track.style.transition = "";

            track.style.transform =
                `translate3d(0, -${startPosition}px, 0)`;

            track.style.filter =
                "blur(0)";
        }
    );
}

function getCurrentSymbols(index) {
    const data =
        reelData[index];

    const symbolsInTrack =
        data.track.querySelectorAll(
            ".symbol"
        );

    const currentIndex =
        Math.round(
            Math.abs(
                data.position
            ) /
            data.symbolHeight
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
        symbolsInTrack[
            topIndex
        ].textContent,

        symbolsInTrack[
            middleIndex
        ].textContent,

        symbolsInTrack[
            bottomIndex
        ].textContent
    ];
}

function spinReel(index) {
    const data =
        reelData[index];

    data.lastTime = null;

    animationFrames[index] =
        requestAnimationFrame(
            time => {
                updateReel(
                    index,
                    time
                );
            }
        );
}

function updateReel(
    index,
    timestamp
) {
    if (
        !spinning ||
        stopped[index]
    ) {
        return;
    }

    const data =
        reelData[index];

    if (
        data.lastTime === null
    ) {
        data.lastTime =
            timestamp;
    }

    const delta =
        (
            timestamp -
            data.lastTime
        ) / 1000;

    data.lastTime =
        timestamp;

    data.position +=
        SPIN_SPEED *
        delta;

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
        requestAnimationFrame(
            time => {
                updateReel(
                    index,
                    time
                );
            }
        );
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

    const data =
        reelData[index];

    data.track.style.filter =
        "blur(0)";

    if (
        animationFrames[index] !==
        null
    ) {
        cancelAnimationFrame(
            animationFrames[index]
        );

        animationFrames[index] =
            null;
    }

    const snappedPosition =
        Math.round(
            data.position /
            data.symbolHeight
        ) *
        data.symbolHeight;

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
        data.track.style.transition =
            "";

        data.reel.classList.add(
            "stopped"
        );

        setTimeout(() => {
            data.reel.classList.remove(
                "stopped"
            );
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

    if (coin < bet) {
        message.textContent =
            "COINが足りません！";

        playSound(
            120,
            0.2,
            "sawtooth"
        );

        return;
    }

    coin -= bet;

    coinDisplay.textContent =
        coin;

    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    audioContext.resume();

    playSound(
        180,
        0.15
    );

    spinning = true;
    resultFinished = false;

    spinButton.disabled = true;

    document
        .querySelectorAll(".symbol")
        .forEach(symbol => {
            symbol.classList.remove(
                "win"
            );
        });

    message.textContent =
        "STOPで止めよう！";

    stopped = [
        false,
        false,
        false
    ];

    setupReels();

    document
        .querySelectorAll(
            ".stop-button"
        )
        .forEach(button => {
            button.disabled =
                false;
        });

    for (
        let i = 0;
        i < 3;
        i++
    ) {
        spinReel(i);
    }
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
            getCurrentSymbols(
                column
            );
    }

    checkResult(grid);

    spinning = false;

    spinButton.disabled =
        false;

    document
        .querySelectorAll(
            ".stop-button"
        )
        .forEach(button => {
            button.disabled =
                false;
        });
}

function highlightLine(line) {
    line.forEach(
        ([column, row]) => {
            const data =
                reelData[column];

            const symbolsInReel =
                data.track.querySelectorAll(
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

            const symbol =
                symbolsInReel[
                    actualIndex
                ];

            if (symbol) {
                symbol.classList.add(
                    "win"
                );
            }
        }
    );
}

function successEffect() {
    const game =
        document.querySelector(
            ".game"
        );

    game.classList.remove(
        "shake"
    );

    void game.offsetWidth;

    game.classList.add(
        "shake"
    );

    game.classList.remove(
        "success-flash"
    );

    void game.offsetWidth;

    game.classList.add(
        "success-flash"
    );

    for (
        let i = 0;
        i < 35;
        i++
    ) {
        const spark =
            document.createElement(
                "div"
            );

        spark.className =
            "spark";

        spark.style.left =
            "50%";

        spark.style.top =
            "50%";

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

        document.body.appendChild(
            spark
        );

        setTimeout(() => {
            spark.remove();
        }, 800);
    }
}

function checkResult(grid) {
    const scoreValues = {
        "7️⃣": 500,
        "BAR": 300,
        "🔔": 200,
        "🍉": 150,
        "🍒": 100
    };

    const resultNames = {
        "7️⃣": "大当たり！",
        "BAR": "中当たり！",
        "🔔": "小当たり！",
        "🍉": "小当たり！",
        "🍒": "当たり！"
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
        const [a, b, c] =
            line;

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
                symbolA === "🍋"
            ) {
                bonus = true;
                return;
            }

            if (
                scoreValues[
                    symbolA
                ]
            ) {
                baseScore +=
                    scoreValues[
                        symbolA
                    ];

                resultText =
                    resultNames[
                        symbolA
                    ];
            }
        }
    });

    if (bonus) {
        const bonusScore =
            250;

        score +=
            bonusScore;

        coin +=
            bonusScore;

        scoreDisplay.textContent =
            score;

        coinDisplay.textContent =
            coin;

        message.textContent =
            `🍋 BONUS！ +${bonusScore} SCORE`;

        playWinSound();

        successEffect();

        return;
    }

    if (baseScore > 0) {
        score +=
            baseScore;

        coin +=
            baseScore;

        scoreDisplay.textContent =
            score;

        coinDisplay.textContent =
            coin;

        message.textContent =
            `${resultText} +${baseScore} SCORE`;

        playWinSound();

        successEffect();

        return;
    }

    message.textContent =
        "もう一度チャレンジ！";

    playSound(
        160,
        0.12,
        "triangle"
    );
}

function toggleInfo() {
    infoPanel.classList.toggle(
        "show"
    );
}

createReels();

spinButton.disabled =
    false;

spinButton.addEventListener(
    "click",
    spin
);

document
    .querySelectorAll(
        ".stop-button"
    )
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

        betValue.textContent =
            bet;
    }
);

infoButton.addEventListener(
    "click",
    toggleInfo
);