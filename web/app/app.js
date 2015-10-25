requirejs.config({
    baseUrl: '/',
    paths: {
        lib: '/js/lib'
    }
});

// Start the main app logic.
requirejs(['app/game'],
    function(game) {}
);
