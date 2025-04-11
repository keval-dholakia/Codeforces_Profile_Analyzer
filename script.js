// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const cfHandleInput = document.getElementById('cfHandle');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const themeToggle = document.getElementById('themeToggle');
const contestTooltip = document.getElementById('contestTooltip');
const difficultyFilter = document.getElementById('difficultyFilter');
const tagFilter = document.getElementById('tagFilter');
const unsolvedProblemsDiv = document.getElementById('unsolvedProblems');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfoSpan = document.getElementById('pageInfo');
const showSolvedToggle = document.getElementById('showSolvedToggle');
const problemsGrid = document.getElementById('problemsGrid');
const addTagBtn = document.getElementById('addTagBtn');
const tagPopup = document.getElementById('tagPopup');
const closeTagPopup = document.getElementById('closeTagPopup');
const tagSearch = document.getElementById('tagSearch');
const selectedTagsContainer = document.getElementById('selectedTags');

// Theme Management
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
let currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', currentTheme);

// Initialize theme and charts on page load
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
    initializeChartDefaults();
    // Initialize Select2 for tag filter with enhanced features
    $('#tagFilter').select2({
        placeholder: 'Select problem tags',
        allowClear: true,
        theme: 'default',
        width: '100%',
        maximumSelectionLength: 5,
        templateResult: formatTagOption,
        templateSelection: formatTagSelection,
        closeOnSelect: false,
        selectionAdapter: $.fn.select2.amd.require('select2/selection/multiple'),
        dropdownAutoWidth: true,
        dropdownParent: $('.filters'),
        language: {
            maximumSelected: function (e) {
                return "You can only select up to " + e.maximum + " tags";
            },
            noResults: function () {
                return "No tags found";
            },
            searching: function () {
                return "Searching...";
            }
        }
    });

    // Update Select2 theme when dark mode changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const currentSelection = $('#tagFilter').val();
                $('#tagFilter').select2('destroy');
                $('#tagFilter').select2({
                    placeholder: 'Select problem tags',
                    allowClear: true,
                    theme: 'default',
                    width: '100%',
                    maximumSelectionLength: 5,
                    templateResult: formatTagOption,
                    templateSelection: formatTagSelection,
                    closeOnSelect: false,
                    selectionAdapter: $.fn.select2.amd.require('select2/selection/multiple'),
                    dropdownAutoWidth: true,
                    dropdownParent: $('.filters'),
                    language: {
                        maximumSelected: function (e) {
                            return "You can only select up to " + e.maximum + " tags";
                        },
                        noResults: function () {
                            return "No tags found";
                        },
                        searching: function () {
                            return "Searching...";
                        }
                    }
                }).val(currentSelection).trigger('change');
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

function initializeChartDefaults() {
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
    Chart.defaults.plugins.tooltip.titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    Chart.defaults.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    Chart.defaults.plugins.tooltip.borderWidth = 1;
}

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();

    // Update chart defaults and redraw if charts exist
    initializeChartDefaults();
    if (lastAnalysis && lastRatingHistory) {
        displayCharts(lastAnalysis, lastRatingHistory);
    }
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('.theme-toggle-icon');
    icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// Store last analysis for theme switching
let lastAnalysis = null;
let lastRatingHistory = null;

// Swiper Initialization
let swiper = null;

function initSwiper() {
    if (swiper) {
        swiper.destroy();
    }

    swiper = new Swiper('.swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        keyboard: {
            enabled: true,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

// Chart.js Global Configuration
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

// Result display elements
const resultHandleSpan = document.getElementById('resultHandle');
const currentRatingSpan = document.getElementById('currentRating');
const currentRankSpan = document.getElementById('currentRank');
const maxRatingSpan = document.getElementById('maxRating');
const maxRankSpan = document.getElementById('maxRank');
const contributionSpan = document.getElementById('contribution');
const registeredSpan = document.getElementById('registered');
const totalSubmissionsSpan = document.getElementById('totalSubmissions');
const uniqueSolvedSpan = document.getElementById('uniqueSolved');

// Canvas elements
const verdictChartCanvas = document.getElementById('verdictChart').getContext('2d');
const languageChartCanvas = document.getElementById('languageChart').getContext('2d');
const difficultyChartCanvas = document.getElementById('difficultyChart').getContext('2d');
const tagChartCanvas = document.getElementById('tagChart').getContext('2d');
const ratingChartCanvas = document.getElementById('ratingChart').getContext('2d');
const dayChartCanvas = document.getElementById('dayChart').getContext('2d');
const hourChartCanvas = document.getElementById('hourChart').getContext('2d');

const CODEFORCES_API_URL = 'https://codeforces.com/api/';

// Store chart instances
let charts = {
    verdict: null,
    language: null,
    difficulty: null,
    tag: null,
    rating: null,
    day: null,
    hour: null
};

// Constants for analysis
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

// Add to global variables
let unsolvedProblemsData = [];
let currentPage = 1;
const problemsPerPage = 12;
let availableDifficulties = new Set();
let availableTags = new Set();
let allProblems = [];
let solvedProblems = new Set();

// Add tag management variables
let selectedTags = new Set();
const tagCategories = {
    'data-structures': ['binary search', 'trees', 'graphs', 'hashing', 'arrays', 'strings'],
    'algorithms': ['dp', 'greedy', 'implementation', 'math', 'sortings', 'constructive algorithms'],
    'techniques': ['bitmasks', 'two pointers', 'meet-in-the-middle', 'divide and conquer'],
    'advanced': ['fft', 'flows', 'geometry', 'string suffix structures', 'game theory']
};

// --- Event Listeners ---
analyzeBtn.addEventListener('click', analyzeUser);
cfHandleInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        analyzeUser();
    }
});

// Add event listeners for tag management
addTagBtn.addEventListener('click', () => {
    tagPopup.classList.add('active');
    populateTagPopup();
});

closeTagPopup.addEventListener('click', () => {
    tagPopup.classList.remove('active');
});

tagSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterTags(searchTerm);
});

// Close popup when clicking outside
tagPopup.addEventListener('click', (e) => {
    if (e.target === tagPopup) {
        tagPopup.classList.remove('active');
    }
});

// --- Main Analysis Function ---
async function analyzeUser() {
    const handle = cfHandleInput.value.trim();
    if (!handle) {
        showError("Please enter a Codeforces handle.");
        return;
    }

    showLoading(true);
    hideError();
    hideResults();
    destroyCharts();

    try {
        console.log('Fetching user data...');
        const [userInfoResponse, userStatusResponse, userRatingResponse] = await Promise.all([
            fetch(`${CODEFORCES_API_URL}user.info?handles=${handle}`).catch(err => {
                console.error('User info fetch error:', err);
                throw new Error('Failed to fetch user info');
            }),
            fetch(`${CODEFORCES_API_URL}user.status?handle=${handle}&from=1`).catch(err => {
                console.error('User status fetch error:', err);
                throw new Error('Failed to fetch user submissions');
            }),
            fetch(`${CODEFORCES_API_URL}user.rating?handle=${handle}`).catch(err => {
                console.error('User rating fetch error:', err);
                throw new Error('Failed to fetch rating history');
            })
        ]);

        console.log('Checking response status...');
        // Check for network errors
        if (!userInfoResponse.ok) {
            console.error('User info response not ok:', await userInfoResponse.text());
            throw new Error(`User not found or API error`);
        }
        if (!userStatusResponse.ok) {
            console.error('User status response not ok:', await userStatusResponse.text());
            throw new Error(`Failed to fetch submissions`);
        }
        if (!userRatingResponse.ok) {
            console.error('User rating response not ok:', await userRatingResponse.text());
            throw new Error(`Failed to fetch rating history`);
        }

        console.log('Parsing response data...');
        const userInfoData = await userInfoResponse.json();
        const userStatusData = await userStatusResponse.json();
        const userRatingData = await userRatingResponse.json();

        // Check API response status
        if (userInfoData.status !== 'OK') {
            console.error('User info API error:', userInfoData);
            throw new Error(userInfoData.comment || 'API Error');
        }
        if (userStatusData.status !== 'OK') {
            console.error('User status API error:', userStatusData);
            throw new Error(userStatusData.comment || 'API Error');
        }
        if (userRatingData.status !== 'OK') {
            console.error('User rating API error:', userRatingData);
            throw new Error(userRatingData.comment || 'API Error');
        }

        console.log('Processing user data...');
        const userInfo = userInfoData.result[0];
        const submissions = userStatusData.result;
        const ratingHistory = userRatingData.result;

        const analysis = analyzeSubmissions(submissions);

        console.log('Displaying results...');
        // Display results
        displayBasicInfo(userInfo, submissions.length, analysis.uniqueSolvedCount);
        displayCharts(analysis, ratingHistory);
        showResults();

        console.log('Fetching problems...');
        // Fetch and display problems
        await fetchProblems(handle);

        console.log('Initializing swiper...');
        // Initialize swiper after charts are created
        setTimeout(() => {
            initSwiper();
        }, 100);

    } catch (err) {
        console.error("Analysis Error:", err);
        showError(err.message || 'An unexpected error occurred');
    } finally {
        showLoading(false);
    }
}

// --- Data Display Functions ---
function displayBasicInfo(info, submissionCount, solvedCount) {
    resultHandleSpan.textContent = info.handle;
    resultHandleSpan.style.color = getRankColor(info.rank);

    currentRatingSpan.textContent = info.rating || 'Unrated';
    currentRankSpan.textContent = formatRank(info.rank);
    currentRankSpan.style.color = getRankColor(info.rank);

    maxRatingSpan.textContent = info.maxRating || 'N/A';
    maxRankSpan.textContent = formatRank(info.maxRank);
    maxRankSpan.style.color = getRankColor(info.maxRank);

    contributionSpan.textContent = info.contribution || 0;
    registeredSpan.textContent = new Date(info.registrationTimeSeconds * 1000).toLocaleDateString();
    totalSubmissionsSpan.textContent = submissionCount;
    uniqueSolvedSpan.textContent = solvedCount;
}

function displayCharts(analysis, ratingHistory) {
    // Store the analysis for theme switching
    lastAnalysis = analysis;
    lastRatingHistory = ratingHistory;

    // Destroy existing charts
    destroyCharts();

    // Rating History Chart
    if (ratingHistory && ratingHistory.length > 0) {
        charts.rating = createLineChart(ratingChartCanvas, {
            labels: ratingHistory.map(r => new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString()),
            datasets: [{
                label: 'Rating',
                data: ratingHistory.map(r => r.newRating),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') + '20',
                tension: 0.4,
                fill: true
            }]
        });
    }

    // Verdict Chart
    charts.verdict = createPieChart(verdictChartCanvas, {
        labels: Object.keys(analysis.verdicts),
        data: Object.values(analysis.verdicts)
    });

    // Language Chart
    charts.language = createPieChart(languageChartCanvas, {
        labels: Object.keys(analysis.languages),
        data: Object.values(analysis.languages)
    });

    // Difficulty Chart
    charts.difficulty = createBarChart(difficultyChartCanvas, {
        labels: Object.keys(analysis.difficulties),
        data: Object.values(analysis.difficulties),
        label: 'Problems'
    });

    // Tags Chart
    const topTags = Object.entries(analysis.tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    charts.tag = createBarChart(tagChartCanvas, {
        labels: topTags.map(t => t[0]),
        data: topTags.map(t => t[1]),
        label: 'Problems'
    });

    // Day Chart
    charts.day = createBarChart(dayChartCanvas, {
        labels: DAYS_OF_WEEK,
        data: analysis.submissionDays,
        label: 'Submissions'
    });

    // Hour Chart
    charts.hour = createBarChart(hourChartCanvas, {
        labels: HOURS_OF_DAY,
        data: analysis.submissionHours,
        label: 'Submissions'
    });
}

// --- Chart Creation Functions ---
function createLineChart(ctx, data) {
    const tooltip = document.getElementById('contestTooltip');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Rating',
                data: data.datasets[0].data,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() + '20',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                pointBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false,
                    external: function (context) {
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltip.classList.add('hidden');
                            return;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        const contest = lastRatingHistory[tooltipModel.dataPoints[0].dataIndex];

                        tooltip.classList.remove('hidden');
                        tooltip.querySelector('.contest-name').textContent = contest.contestName;
                        tooltip.querySelector('.old-rating').textContent = contest.oldRating;
                        tooltip.querySelector('.new-rating').textContent = contest.newRating;
                        tooltip.querySelector('.contest-rank').textContent = `Rank: ${contest.rank}`;

                        const tooltipEl = tooltip;
                        const left = position.left + window.pageXOffset + tooltipModel.caretX;
                        const top = position.top + window.pageYOffset + tooltipModel.caretY;

                        tooltipEl.style.left = left + 'px';
                        tooltipEl.style.top = top + 'px';
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createPieChart(ctx, data) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: generateColors(data.labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createBarChart(ctx, data) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.label,
                data: data.data,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                borderColor: 'transparent'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// --- Utility Functions ---
function generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
    ];
    return Array(count).fill().map((_, i) => colors[i % colors.length]);
}

function destroyCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    charts = {};
}

function formatRank(rank) {
    if (!rank) return '';
    // Capitalize words and replace underscores
    return rank.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getRankColor(rank) {
    // (Keep the existing getRankColor function)
    if (!rank) return '#808080';
    rank = rank.toLowerCase().replace(/ /g, '-').replace(/_/g, '-');

    const colors = {
        'newbie': '#808080', // Gray
        'pupil': '#008000', // Green
        'specialist': '#03a89e', // Cyan
        'expert': '#0000ff', // Blue
        'candidate-master': '#aa00aa', // Violet
        'master': '#ff8c00', // Orange
        'international-master': '#ff8c00', // Orange
        'grandmaster': '#ff0000', // Red
        'international-grandmaster': '#ff0000', // Red
        'legendary-grandmaster': '#ff0000' // Red
    };
    return colors[rank] || '#333';
}

function sortObjectByValue(obj) {
    // (Keep the existing sortObjectByValue function)
    return Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

function sortObjectByKey(obj, numeric = true) {
    // (Keep the existing sortObjectByKey function)
    return Object.entries(obj)
        .sort(([aKey], [bKey]) => {
            if (aKey === 'Unknown') return 1;
            if (bKey === 'Unknown') return -1;
            if (numeric) {
                return Number(aKey) - Number(bKey);
            } else {
                return aKey.localeCompare(bKey);
            }
        })
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

function analyzeSubmissions(submissions) {
    const verdicts = {};
    const languages = {};
    const difficulties = {};
    const tags = {};
    const solvedProblems = new Set();
    const submissionDays = Array(7).fill(0);
    const submissionHours = Array(24).fill(0);

    submissions.forEach(submission => {
        // Count verdicts
        const verdict = submission.verdict || 'PENDING';
        verdicts[verdict] = (verdicts[verdict] || 0) + 1;

        // Count languages
        const lang = submission.programmingLanguage;
        languages[lang] = (languages[lang] || 0) + 1;

        // Analyze submission patterns
        const subDate = new Date(submission.creationTimeSeconds * 1000);
        submissionDays[subDate.getDay()]++;
        submissionHours[subDate.getHours()]++;

        // Analyze problems (only count accepted solutions)
        if (submission.verdict === 'OK') {
            const problemId = `${submission.problem.contestId}-${submission.problem.index}`;

            if (!solvedProblems.has(problemId)) {
                solvedProblems.add(problemId);

                // Count problem tags
                if (submission.problem.tags) {
                    submission.problem.tags.forEach(tag => {
                        tags[tag] = (tags[tag] || 0) + 1;
                    });
                }

                // Count problem difficulties
                const rating = submission.problem.rating || 'Unrated';
                difficulties[rating] = (difficulties[rating] || 0) + 1;
            }
        }
    });

    // Sort data
    const sortedVerdicts = sortObjectByValue(verdicts);
    const sortedLanguages = sortObjectByValue(languages);
    const sortedDifficulties = sortObjectByKey(difficulties, true);
    const sortedTags = sortObjectByValue(tags);

    return {
        verdicts: sortedVerdicts,
        languages: sortedLanguages,
        difficulties: sortedDifficulties,
        tags: sortedTags,
        uniqueSolvedCount: solvedProblems.size,
        submissionDays,
        submissionHours
    };
}

// Update fetchUnsolvedProblems to fetchProblems
async function fetchProblems(handle) {
    try {
        // Fetch all problems
        const problemsResponse = await fetch('https://codeforces.com/api/problemset.problems');
        if (!problemsResponse.ok) throw new Error('Failed to fetch problems');

        const problemsData = await problemsResponse.json();
        if (problemsData.status !== 'OK') throw new Error(problemsData.comment || 'API Error');

        // Fetch user's submissions
        const userSubmissions = await fetch(`${CODEFORCES_API_URL}user.status?handle=${handle}`);
        if (!userSubmissions.ok) throw new Error('Failed to fetch submissions');

        const submissionsData = await userSubmissions.json();
        if (submissionsData.status !== 'OK') throw new Error(submissionsData.comment || 'API Error');

        // Get solved problems
        solvedProblems.clear();
        submissionsData.result.forEach(submission => {
            if (submission.verdict === 'OK') {
                solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
            }
        });

        // Store all problems
        allProblems = problemsData.result.problems;

        // Collect available difficulties and tags
        availableDifficulties.clear();
        availableTags.clear();
        allProblems.forEach(problem => {
            if (problem.rating) availableDifficulties.add(problem.rating);
            problem.tags.forEach(tag => availableTags.add(tag));
        });

        // Update filter options
        updateFilterOptions();

        // Display first page
        currentPage = 1;
        displayProblems();
    } catch (error) {
        console.error('Error fetching problems:', error);
    }
}

function displayProblems() {
    const difficultyValue = difficultyFilter.value;
    const showSolved = showSolvedToggle.checked;

    // Filter problems
    let filteredProblems = allProblems;

    if (difficultyValue !== 'all') {
        filteredProblems = filteredProblems.filter(p => p.rating === parseInt(difficultyValue));
    }
    if (selectedTags.size > 0) {
        filteredProblems = filteredProblems.filter(p =>
            Array.from(selectedTags).some(tag => p.tags.includes(tag))
        );
    }
    if (!showSolved) {
        filteredProblems = filteredProblems.filter(p => !solvedProblems.has(`${p.contestId}-${p.index}`));
    }

    // Sort problems by difficulty and then by contest ID
    filteredProblems.sort((a, b) => {
        if (a.rating !== b.rating) {
            return (a.rating || 0) - (b.rating || 0);
        }
        return b.contestId - a.contestId;
    });

    // Update pagination
    const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);
    currentPage = Math.min(currentPage, totalPages || 1);
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    // Get current page problems
    const startIdx = (currentPage - 1) * problemsPerPage;
    const pageProblems = filteredProblems.slice(startIdx, startIdx + problemsPerPage);

    // Display problems
    problemsGrid.innerHTML = pageProblems.map(problem => {
        const isSolved = solvedProblems.has(`${problem.contestId}-${problem.index}`);
        return `
            <div class="problem-card ${isSolved ? 'solved' : ''}">
                <div class="problem-title">
                    <a href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}" 
                       target="_blank" rel="noopener noreferrer">
                        ${problem.index}. ${problem.name}
                    </a>
                    ${isSolved ? '<i class="ri-check-line problem-status"></i>' : ''}
                </div>
                <div class="problem-info">
                    <div class="problem-rating">
                        <i class="ri-star-line"></i>
                        <span>${problem.rating || 'Unrated'}</span>
                    </div>
                    <span>Contest #${problem.contestId}</span>
                </div>
                <div class="problem-tags">
                    ${problem.tags.map(tag => `<span class="problem-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Show no results message if needed
    if (pageProblems.length === 0) {
        problemsGrid.innerHTML = `
            <div class="no-results">
                <i class="ri-error-warning-line"></i>
                <p>No problems found matching your criteria</p>
            </div>
        `;
    }
}

// Update event listeners
difficultyFilter.addEventListener('change', () => {
    currentPage = 1;
    displayProblems();
});

$('#tagFilter').on('change', () => {
    currentPage = 1;
    displayProblems();
});

showSolvedToggle.addEventListener('change', () => {
    currentPage = 1;
    displayProblems();
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayProblems();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allProblems.length / problemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProblems();
    }
});

// Update filter options
function updateFilterOptions() {
    // Update difficulty filter
    difficultyFilter.innerHTML = '<option value="all">All Difficulties</option>';
    Array.from(availableDifficulties).sort((a, b) => a - b).forEach(difficulty => {
        difficultyFilter.innerHTML += `<option value="${difficulty}">${difficulty}</option>`;
    });

    // Update available tags
    availableTags = new Set(Array.from(availableTags).sort());
    populateTagPopup();
}

// Tag formatting functions
function formatTagOption(tag) {
    if (!tag.id) return tag.text;

    const tagCategories = {
        'data structures': ['binary search', 'trees', 'graphs', 'hashing', 'arrays', 'strings'],
        'algorithms': ['dp', 'greedy', 'implementation', 'math', 'sortings', 'constructive algorithms'],
        'techniques': ['bitmasks', 'two pointers', 'meet-in-the-middle', 'divide and conquer'],
        'advanced': ['fft', 'flows', 'geometry', 'string suffix structures', 'game theory']
    };

    let category = 'other';
    for (const [cat, tags] of Object.entries(tagCategories)) {
        if (tags.includes(tag.text.toLowerCase())) {
            category = cat;
            break;
        }
    }

    const tagColors = {
        'data structures': '#4CAF50',
        'algorithms': '#2196F3',
        'techniques': '#9C27B0',
        'advanced': '#F44336',
        'other': '#607D8B'
    };

    return $(`<div class="select2-tag-option">
        <span class="tag-category" style="color: ${tagColors[category]}">
            ${category.charAt(0).toUpperCase() + category.slice(1)}:
        </span>
        <span class="tag-name">${tag.text}</span>
    </div>`);
}

function formatTagSelection(tag) {
    if (!tag.id) return tag.text;
    return $(`<span class="selected-tag">${tag.text}</span>`);
}

// Tag management functions
function populateTagPopup() {
    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        const categoryName = category.dataset.category;
        const categoryTags = category.querySelector('.category-tags');
        categoryTags.innerHTML = '';

        // Get tags for this category
        const tags = getTagsByCategory(categoryName);
        tags.forEach(tag => {
            if (availableTags.has(tag)) {
                const tagElement = createTagElement(tag);
                categoryTags.appendChild(tagElement);
            }
        });
    });
}

function getTagsByCategory(category) {
    if (category === 'other') {
        // Return tags that don't belong to any other category
        return Array.from(availableTags).filter(tag => {
            return !Object.values(tagCategories).flat().includes(tag.toLowerCase());
        });
    }
    return tagCategories[category] || [];
}

function createTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = `tag-item ${selectedTags.has(tag) ? 'selected' : ''}`;
    tagElement.textContent = tag;
    tagElement.addEventListener('click', () => toggleTag(tag, tagElement));
    return tagElement;
}

function toggleTag(tag, tagElement) {
    if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        tagElement.classList.remove('selected');
        removeSelectedTagElement(tag);
    } else {
        selectedTags.add(tag);
        tagElement.classList.add('selected');
        addSelectedTagElement(tag);
    }
    currentPage = 1;
    displayProblems();
}

function addSelectedTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = 'selected-tag';
    tagElement.innerHTML = `
        <span>${tag}</span>
        <button class="remove-tag" data-tag="${tag}">
            <i class="ri-close-line"></i>
        </button>
    `;
    tagElement.querySelector('.remove-tag').addEventListener('click', (e) => {
        const tag = e.currentTarget.dataset.tag;
        selectedTags.delete(tag);
        tagElement.remove();
        updateTagPopup();
        currentPage = 1;
        displayProblems();
    });
    selectedTagsContainer.appendChild(tagElement);
}

function removeSelectedTagElement(tag) {
    const tagElement = selectedTagsContainer.querySelector(`[data-tag="${tag}"]`).parentElement;
    if (tagElement) {
        tagElement.remove();
    }
}

function filterTags(searchTerm) {
    const tagElements = document.querySelectorAll('.tag-item');
    tagElements.forEach(tagElement => {
        const tag = tagElement.textContent.toLowerCase();
        if (tag.includes(searchTerm)) {
            tagElement.style.display = '';
        } else {
            tagElement.style.display = 'none';
        }
    });

    // Show/hide categories based on whether they have visible tags
    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        const hasVisibleTags = Array.from(category.querySelectorAll('.tag-item'))
            .some(tag => tag.style.display !== 'none');
        category.style.display = hasVisibleTags ? '' : 'none';
    });
}

function updateTagPopup() {
    const tagElements = document.querySelectorAll('.tag-item');
    tagElements.forEach(tagElement => {
        const tag = tagElement.textContent;
        tagElement.classList.toggle('selected', selectedTags.has(tag));
    });
}

// --- UI Control Functions ---
function showLoading(isLoading) {
    loadingDiv.classList.toggle('hidden', !isLoading);
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function showResults() {
    resultsDiv.classList.remove('hidden');
    // Force a reflow to trigger the animation
    resultsDiv.offsetHeight;
    resultsDiv.style.opacity = '1';
    resultsDiv.style.transform = 'translateY(0)';
}

function hideResults() {
    resultsDiv.style.opacity = '0';
    resultsDiv.style.transform = 'translateY(20px)';
    resultsDiv.classList.add('hidden');
}