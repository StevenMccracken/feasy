# Checks if the mongod process is running. If it is not running, starts it

if pgrep mongod; then
  echo mongod is already running;
else
  echo starting mongod;
  mongod;
fi

exit 0;
