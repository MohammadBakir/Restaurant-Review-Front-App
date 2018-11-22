window.addEventListener('online', function(e) {
      if (navigator.onLine) {
        DBHelper.updateDatabaseWhenOnline();
        DBHelper.updateDatabaseForFavStatusWhenOnline();
      } 
  }, false);