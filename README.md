# vflux
Video transition generator

***This app is currently under development and may not work***

### What is vflux?

 vflux is an attempt to use nodejs/electron to create transition clips
 for two videos.

 It's original intent is to be used by ***clipxv*** as a transition plugin<br>
 https://github.com/if-else-return-null/clipxv

 Could also be used as a standalone app



### How does it work?
 * vflux needs a duration ,video_a, video_b and transitionType
    * video_a and video_b are assumed to be the same format (container, codec, geometry)


 * cut video_a at (1/2 duration) from the end keeping both sides -->
 modified_video_a, end_video_a   

 * cut video_b at (1/2 duration) from the begining keeping both sides -->
 modified_video_b, begin_video_b

 * concat  end_video_a and begin_video_b and then extract the audio stream
 from the concated output --> audio_ab

 * extract the last frame of modified_video_a --> start_img
 * extract the first frame of modified_video_b --> end_img

 * use start_img, end_img, duration and transitionType to create--> video_ab

 * combine audio_ab and video_ab --> audiovideo_ab

 * OUTPUTS
    * for clipxv return --> modified_video_a, audiovideo_ab, modified_video_b

    * for standalone concat modified_video_a, audiovideo_ab, modified_video_b --> final_output_ab
