export const quickStart = [
  {
    platform: 'Android',
    requirement: 'Android 8.0 or newer · arm64',
    summary: 'Install Termux first only if you want local compilers, terminals, servers, or framework toolchains.',
    steps: [
      'Install the current Termux release from F-Droid, then open it once and let its initial environment finish preparing.',
      'Download the GenXYZ Lab APK from the official website. If Android asks, allow your browser or Drive to install apps from this source.',
      'Install and open GenXYZ Lab, enter the name you want printed on certificates, and choose your course interests.',
      'Open Code Practice → Compilers → Compiler Manager. Select a language or framework and follow the guided setup.',
      'For long-running previews and servers, set Termux battery usage to Unrestricted in Android settings.',
    ],
  },
  {
    platform: 'Windows',
    requirement: 'Windows 10 or 11 · 64-bit',
    summary: 'The Windows build uses compilers and SDKs already installed on your PC and available on PATH.',
    steps: [
      'Download the Windows ZIP from the official website.',
      'Extract the entire ZIP to a normal folder. Do not run the application from inside the ZIP archive.',
      'Open the extracted folder and launch the GenXYZ Lab executable. Keep the other extracted files beside it.',
      'Open Code Practice → Compilers → Compiler Manager to detect Python, Node.js, JDK, C/C++, Dart, Rust, Go, Kotlin, and TypeScript tools.',
      'For anything marked missing, use the official install guidance shown by Compiler Manager, then reopen the app so PATH changes are detected.',
    ],
  },
]

export const mainNavigation = [
  {
    name: 'Courses',
    detail: 'Browse the 70-course offline catalog, online additions, and courses you downloaded for later.',
  },
  {
    name: 'Code Practice',
    detail: 'Write and run code, manage project files, open studios, configure compilers, and use the terminal or AI assistant.',
  },
  {
    name: 'Daily Activity',
    detail: 'See recent learning, quiz, and coding activity and continue the work you started.',
  },
  {
    name: 'Templates',
    detail: 'Search, inspect, download, preview, and customize the catalog of 129 working project templates.',
  },
]

export const recommendedWorkflow = [
  {
    label: 'Learn',
    title: 'Finish one guided lesson',
    detail: 'Open Courses, choose an offline course, complete its lessons and checkpoints, then take the included quiz.',
  },
  {
    label: 'Practice',
    title: 'Run the idea yourself',
    detail: 'Move to Code Practice, choose one of the ten languages, write a small version of the concept, and inspect the run console.',
  },
  {
    label: 'Build',
    title: 'Turn it into a project',
    detail: 'Choose a template or framework starter, add it to your workspace, edit the files, preview it, and export or deploy when ready.',
  },
]

export const featureGroups = [
  {
    id: 'learning',
    title: 'Courses and offline learning',
    summary: 'Structured learning remains usable even when the network does not.',
    features: [
      {
        name: '70 offline courses',
        detail: 'Bundled guided courses are available immediately, with online and Drive-catalog courses merged in when a connection is available.',
      },
      {
        name: 'Course search and filters',
        detail: 'Search the catalog and switch between All, Offline, Online, and Downloads without losing your place.',
      },
      {
        name: 'Background course downloads',
        detail: 'Download supported courses for offline use, follow progress on the course card, and remove or download them again later.',
      },
      {
        name: 'Guided levels and lesson material',
        detail: 'Move through written explanations, examples, downloadable material, checkpoints, breaks, media, and lesson code blocks.',
      },
      {
        name: 'Course interests',
        detail: 'Choose learning interests during onboarding or in Settings to narrow the home catalog while keeping an option to show everything.',
      },
      {
        name: 'Add a course',
        detail: 'Open a supported course from a shared link or QR code, including offline bundle scanning where available.',
      },
    ],
  },
  {
    id: 'creation',
    title: 'Course, exam, and content creation',
    summary: 'Build learning material inside the app, preview it, and share it in the supported portable formats.',
    features: [
      {
        name: 'Full course builder',
        detail: 'Create a certificate-eligible course with ordered levels, lesson pages, quiz gates, course metadata, and completion requirements.',
      },
      {
        name: 'Lesson builder',
        detail: 'Compose lesson pages with explanations and formatted code, including static examples, runnable language blocks, and offline academic-runner blocks.',
      },
      {
        name: 'Exam builder',
        detail: 'Create a standalone practice or assessment quiz with its own title, instructions, scoring behavior, and question set.',
      },
      {
        name: 'Eleven question types',
        detail: 'Single choice, multiple choice, True or False, fill in the blank, short answer, free code editor, matching, drag-and-drop order, predict output, debug code, and tested programming problems.',
      },
      {
        name: 'Course and exam export',
        detail: 'Publish the generated file structure, optionally encrypt course or quiz files, and prepare supported links, QR information, and offline codes for learners.',
      },
      {
        name: 'AI prompt generator',
        detail: 'Answer a guided set of questions and copy a structured prompt that asks an external AI assistant to create course or exam files in the expected format.',
      },
      {
        name: 'My Creations',
        detail: 'Reopen saved course and exam drafts, edit them for another class, preview the learner experience, recover their offline code, or delete them.',
      },
    ],
  },
  {
    id: 'code',
    title: 'Code Practice and local toolchains',
    summary: 'A project-aware editor and run environment for ten programming languages.',
    features: [
      {
        name: 'Ten language workflows',
        detail: 'Python, Java, JavaScript, TypeScript, C, C++, Dart, Rust, Go, and Kotlin.',
      },
      {
        name: 'Code editor',
        detail: 'Syntax highlighting, line numbers, line wrapping, adjustable text and themes, automatic indentation, and automatic bracket and quote closing.',
      },
      {
        name: 'Workspace files',
        detail: 'Create and open project files, keep projects in a workspace, and move between source files without reducing the project to one snippet.',
      },
      {
        name: 'Run sessions and console',
        detail: 'Run code, keep separate output sessions, stop long-running programs, reopen active output, and open detected local previews.',
      },
      {
        name: 'Compiler Manager',
        detail: 'Detect toolchains, show what is missing, provide platform-specific install steps, and diagnose common Termux and PATH failures.',
      },
      {
        name: 'Terminal access',
        detail: 'Run shell commands through Termux on Android or the local desktop shell on Windows, with output kept inside the app.',
      },
      {
        name: 'Live web preview',
        detail: 'Reload projects, test responsive widths, view actual size, open full screen, inspect server logs, restart servers, and open the result in a browser.',
      },
      {
        name: 'Keyboard workflow on desktop',
        detail: 'Shortcuts cover running code, switching languages, opening the workspace, terminal, compilers, editor settings, and AI assistance.',
      },
    ],
  },
  {
    id: 'frameworks',
    title: 'Frameworks and project studios',
    summary: 'Start a real multi-file project instead of copying an isolated example.',
    features: [
      {
        name: 'Web and backend framework catalog',
        detail: 'Flask, Django, Express, Bootstrap, Tailwind, jQuery, React, Vue, Svelte, SolidJS, Nuxt, PHP, Next.js, NestJS, FastAPI, Spring Boot, Gin, Fiber, Axum, Actix Web, Laravel, Ruby on Rails, Ktor, and Drogon.',
      },
      {
        name: 'Web Dev playground',
        detail: 'Edit HTML, CSS, and JavaScript together with a live responsive preview and browser handoff.',
      },
      {
        name: 'Notebook Studio',
        detail: 'Create Python or JavaScript notebooks with ordered cells and a live shared kernel state.',
      },
      {
        name: 'Flutter Studio',
        detail: 'Create Flutter projects, edit files, preview the web target, manage the toolchain, choose devices, and build an Android APK.',
      },
      {
        name: 'Arduino Studio',
        detail: 'Create sketches, choose a target board, manage libraries, verify code, upload to hardware, and use the serial monitor.',
      },
      {
        name: 'Web App Builder',
        detail: 'Turn an existing website project into an Android application package, preview it, and configure APK or AAB output.',
      },
    ],
  },
  {
    id: 'templates',
    title: 'Templates, systems, and games',
    summary: 'Working source projects to run, inspect, and change.',
    features: [
      {
        name: '129 working templates',
        detail: 'Browse bundled and downloadable projects, search by name, filter availability, and keep downloaded copies for later.',
      },
      {
        name: 'Template detail and placement',
        detail: 'Read the overview and README, inspect requirements, tech stack, files, screenshots, and preview, then place the project into Code Practice.',
      },
      {
        name: 'Classic game projects',
        detail: 'Snake, Tic-Tac-Toe, Memory Match, Whack-a-Mole, Pong, Aim Trainer, Breakout, Simon Says, 2048, Tetris, Minesweeper, Connect Four, Chess, and an Interactive Story Engine.',
      },
      {
        name: 'Phaser 2D projects',
        detail: 'Space Shooter, Endless Runner, Flappy-style, Platformer, Card Match, Physics Playground, 2D Racing, Tower Defense, Zombie Shooter, Top-Down Adventure, and Block Blast.',
      },
      {
        name: 'Three.js 3D and interactive projects',
        detail: '3D Solar System, Particle Playground, 3D Globe, 3D Car Demo, Maze Explorer, Space Explorer, House Explorer, 3D City, Subway Dash, Mini Golf, Bowling, Basketball, Tower Stack, Tilt Maze, Air Hockey, Virtual Museum, Interactive Periodic Table, Interactive Anatomy, and Fluid Simulation.',
      },
      {
        name: 'Babylon.js projects',
        detail: '3D Platformer, Target Range, 3D Racing, Physics Sandbox, Billiards, Combat Arena, and Boxing Arena.',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Built-in tools and studios',
    summary: 'The searchable Tools directory exposes every specialized workspace from one place.',
    features: [
      {
        name: 'Studios',
        detail: 'Web Dev, Notebook, Flutter, Arduino, Web App Builder, AI Playground, Dataset Studio, Training Studio, and AI & Vision Projects.',
      },
      {
        name: 'Web and API',
        detail: 'API Tester and Deploy.',
      },
      {
        name: 'Data',
        detail: 'SQL Lab, NoSQL Lab, and DB Connect.',
      },
      {
        name: 'System',
        detail: 'AI Assistant, Terminal, and Compiler Manager.',
      },
      {
        name: 'Tool search and categories',
        detail: 'Search tools by name or purpose and filter them into Studios, Solvers, Data, Web & API, and System.',
      },
    ],
  },
  {
    id: 'data-web',
    title: 'Data, APIs, previews, and deployment',
    summary: 'Test the parts around your code, not just the source file itself.',
    features: [
      {
        name: 'API Tester',
        detail: 'Build REST requests with query parameters, headers, request bodies, authentication, environments and variables; inspect timing, size, headers, raw output, formatted output, and previews.',
      },
      {
        name: 'Offline SQL Lab',
        detail: 'Create tables and practice inserts, updates, deletes, filters, ordering, joins, grouping, aggregates, and common constraints without an external server.',
      },
      {
        name: 'Offline NoSQL Lab',
        detail: 'Create JSON document collections and practice insert, find, update, delete, count, filters, and collection removal.',
      },
      {
        name: 'Database Connect',
        detail: 'Generate connection guidance and sample code for projects using PostgreSQL, MySQL, or MongoDB, including environment-file examples and local server checks.',
      },
      {
        name: 'Deployment preparation',
        detail: 'Run a pre-flight build, choose a supported hosting target, review generated configuration, manage environment-variable guidance, and keep deployment history.',
      },
      {
        name: 'Export and hosting guidance',
        detail: 'Prepare a project folder or ZIP and follow guided flows for GitHub plus targets such as Vercel, Render, and Railway.',
      },
      {
        name: 'Local servers and public tunnels',
        detail: 'Run supported development servers, keep them alive, preview locally, and optionally expose a temporary public URL with explicit confirmation.',
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI, machine learning, and vision',
    summary: 'Optional connected tools for assistance, model projects, and visual experiments.',
    features: [
      {
        name: 'AI Assistant',
        detail: 'Ask questions, plan work, explain code, diagnose problems, and approve project-file edits. Provider configuration lives in Settings.',
      },
      {
        name: 'Provider choice',
        detail: 'Choose a supported frontier or free-tier provider, select a model, use the available secure sign-in or API-key method, or configure a compatible custom endpoint.',
      },
      {
        name: 'AI Playground',
        detail: 'Choose a machine-learning starter and generate a real training project that remains visible in your project list.',
      },
      {
        name: 'Dataset Studio',
        detail: 'Collect and label images, split data into train, validation, and test sets, and inspect dataset health before training.',
      },
      {
        name: 'Training Studio',
        detail: 'Run model training against a project dataset and follow metrics while the job is active.',
      },
      {
        name: 'AI & Vision Projects',
        detail: 'Open ready-made vision experiences, run supported models on a photo or live camera, and explore AR and interactive visual projects.',
      },
      {
        name: 'Coding CLI setup',
        detail: 'Compiler Manager includes guided setup entries for Claude Code, Gemini CLI, and Codex CLI where the host platform supports them.',
      },
    ],
  },
  {
    id: 'solvers',
    title: 'Offline academic solvers',
    summary: 'Thirteen local runners provide calculations, tables, diagrams, and step traces without sending the input to a server.',
    features: [
      { name: 'Number System', detail: 'Binary, octal, decimal, hexadecimal, ASCII, shifts, and bitwise operations.' },
      { name: 'Statistics', detail: 'Mean, median, mode, range, variance, standard deviation, quartiles, frequency, percentiles, and regression.' },
      { name: 'Boolean Logic', detail: 'Evaluate Boolean expressions and generate truth tables.' },
      { name: 'Electronics', detail: "Ohm's law, power, series and parallel resistors, voltage dividers, and RC timing." },
      { name: 'Math', detail: 'Expressions, linear and quadratic equations, simultaneous equations, fractions, and complex numbers.' },
      { name: 'Scientific Equations', detail: 'Common physics equations and unit conversions.' },
      { name: 'Networking', detail: 'IPv4 classes, binary addresses, CIDR masks, subnet ranges, broadcasts, and usable-host counts.' },
      { name: 'Financial Calculator', detail: 'Simple and compound interest, loan payments, ROI, discounts, tax, markup, and margins.' },
      { name: 'Compiler Visualization', detail: 'Tokenization, abstract syntax trees, three-address code, and expression evaluation traces.' },
      { name: 'Algorithm Visualizer', detail: 'Sorting, binary search, graph traversal, shortest paths, and step-by-step traces.' },
      { name: 'Accounting Worksheet', detail: 'Accounts, journals, ledgers, trial balances, income statements, balance sheets, and cash flow.' },
      { name: 'SQL runner', detail: 'A learning SQL engine for tables, queries, joins, grouping, aggregates, and enforced constraints.' },
      { name: 'Chemistry', detail: 'Molar mass, composition, molarity, dilution, moles, pH, and stoichiometry.' },
    ],
  },
  {
    id: 'progress-data',
    title: 'Assessment, progress, and your data',
    summary: 'Keep evidence of learning and portable copies of the work that matters.',
    features: [
      {
        name: 'Quizzes and code questions',
        detail: 'Complete course quizzes and supported runnable-code questions, then review results and scoring.',
      },
      {
        name: 'Exam hub',
        detail: 'Take an exam from the available catalog, a shared link, a QR code, or a supported offline exam code.',
      },
      {
        name: 'Certificates',
        detail: 'Generate polished course-completion certificates using your saved profile name.',
      },
      {
        name: 'Verification',
        detail: 'Verify supported completion and exam records by searching or scanning their QR information.',
      },
      {
        name: 'Daily Activity',
        detail: 'Review recent learning, quiz, and coding activity and use it to return to courses or practice.',
      },
      {
        name: 'Backup and Restore',
        detail: 'Export selected progress, settings, creations, workspaces, notebooks, studios, databases, deployments, and API projects to a portable .qcs file; optionally protect it with a password and preview selected modules before restoring.',
      },
      {
        name: 'Update notifications',
        detail: 'On launch, the app checks official release metadata in the background and shows a dismissible banner when a newer Android or Windows release is available.',
      },
      {
        name: 'Responsive interface and themes',
        detail: 'Bottom navigation on compact screens, a side rail on wider layouts, adaptive dialogs and sheets, and light or dark appearance controls.',
      },
    ],
  },
]

export const troubleshooting = [
  {
    problem: 'Android will not install the APK',
    fixes: [
      'Confirm the download completed and use the official Google Drive link from the GenXYZ Lab website.',
      'Allow “Install unknown apps” for the browser or Drive app that opened the APK, then try again.',
      'If Android reports a conflicting package or signature, back up your data before removing any older or unofficial build.',
    ],
  },
  {
    problem: 'Code does not run on Android',
    fixes: [
      'Install the current F-Droid version of Termux, not the obsolete Play Store build.',
      'Open Termux once, then return to Code Practice → Compilers → Compiler Manager and rerun detection.',
      'Follow the exact install commands shown for that language. The app does not claim a compiler is present until detection succeeds.',
    ],
  },
  {
    problem: 'A Windows compiler is not detected',
    fixes: [
      'Run the compiler command in a new PowerShell or Command Prompt window to confirm it is on PATH.',
      'Close and reopen GenXYZ Lab after installing or changing PATH.',
      'Use Compiler Manager’s official installer link and detection guidance for the selected toolchain.',
    ],
  },
  {
    problem: 'A preview or server stops in the background',
    fixes: [
      'On Android, set Termux battery use to Unrestricted and allow notifications when requested for active servers.',
      'Keep Termux installed and do not force-stop it while GenXYZ Lab is using a local process.',
      'Reopen the run console or server screen and restart the process if Android already stopped it.',
    ],
  },
  {
    problem: 'Online courses, templates, AI, or updates do not load',
    fixes: [
      'Confirm the device has a working connection, then pull to refresh where available.',
      'Offline courses, downloaded content, local editors, databases, and academic solvers remain available without the remote catalog.',
      'AI features also require a configured provider and may depend on that provider’s quota or service availability.',
    ],
  },
]
