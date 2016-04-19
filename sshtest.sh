#!/usr/bin/expect -f
spawn ssh mgrf.de@ssh.strato.de
#expect "assword:"
expect "mgrf.de@ssh.strato.de's password:"
send "2K6cgCOm\r"
#send "echo 'muh'\r"
#send "touch myautomatedfile\r"
#send "exit\r"


#ssh mgrf.de@ssh.strato.de
#yes
#2K6cgCOm
#
#exit
