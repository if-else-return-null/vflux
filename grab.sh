ffmpeg -f x11grab -r 25 -s 1920x1080 -i   outsh.mp4


# get last frame of Video
ffmpeg -sseof -3 -i inputVideo -update 1 -q:v 1 last.jpg
