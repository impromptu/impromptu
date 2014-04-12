#!/usr/sbin/dtrace -s

impromptu*:::socket-connect
{
  req[arg0] = timestamp;
}

impromptu*:::socket-end
/req[arg0]/
{
  @socket = lquantize(((timestamp - req[arg0]) / 1000000), 0, 1000, 10);
}
