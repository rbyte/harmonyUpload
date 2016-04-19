#!/bin/sh
error() {
	echo "error: $1"
	exit 1
}

filePath="$1"
lastChunkIndex="$2"

# check whether all parts exist
# $(...) command substitution syntax does not work
for i in `seq 0 $lastChunkIndex`; do
	[ ! -f "$filePath.part$i" ] && error "parts missing"
done

# overwrite
[ -f "$filePath" ] && rm -f "$filePath"

# append all chunks into first (part0) ... start with 1!
for i in `seq 1 $lastChunkIndex`; do
	part="$filePath.part$i"
	cat "$part" >> "$filePath.part0"
	rm -f "$part"
done

mv "$filePath.part0" "$filePath"
echo "combined $filePath"
