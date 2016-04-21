watchedFile=".execute"
stopFile=".stopWatcher"

timeout=120
now=0

while [ $now -lt $timeout ]
do
    if [ -f "$watchedFile" ]; then
    	mv "$watchedFile" "$watchedFile.running"
    	sh "$watchedFile.running"
    	rm -f "$watchedFile.running"
    fi
    if [ -f "$stopFile" ]; then
    	rm -f "$stopFile"
    	exit 0
    fi
    sleep 1
    now="$((now+1))"
done

nohup sh executeWatcher.sh &
