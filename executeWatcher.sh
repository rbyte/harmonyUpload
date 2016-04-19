watchedFile=".execute"
stopFile=".stopWatcher"

while [ 1 ]
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
done
