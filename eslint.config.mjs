export default [
  {
    ignores: [
      "**/node_modules/**",
      ".agent/**",
      "assets/**"
    ]
  },
  {
    files: ["server.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-duplicate-case": "error",
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        EventSource: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Image: "readonly",
        Audio: "readonly",
        Blob: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        FormData: "readonly",
        CustomEvent: "readonly",
        ResizeObserver: "readonly",
        IntersectionObserver: "readonly",
        // Shared globals across project scripts
        studentManager: "writable",
        soundManager: "writable",
        wheelManager: "writable",
        quizManager: "writable",
        seatingManager: "writable",
        remoteSync: "writable"
      }
    },
    rules: {
      "no-unreachable": "error",
      "no-duplicate-case": "error",
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    }
  }
];
