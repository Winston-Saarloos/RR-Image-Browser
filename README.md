# AugmentedRR
This app is intended to add special functionality to Rec Room that I feel Rec.net is lacking.  I utilize private API's that are undocumented by Rec Room but require no authentication to access.  This allows anyone to use this app without having to login to recnet.  

Users have limited access to the private API's of Rec Room without logging in.  So in the future I plan to expand into authenticated API's but the fear of the app having elevated access is understood.  If I did do this I would have the user login via a browser on the app and then read the bearer token from local storage.  That way I would escape the need to know the players credentials.



## Planned Projects:
Photo Viewer:
User enters in their @ name and then the program will download that user's entire public photo library (not any private photos).  A search bar will exist so a person could search by date, players, or activity.

[] Search bar
[] Sync Process
[] Favorite Photos



Clean up:
  [] Batch photo fetches with promise.all (send max 50 at a time)
  
Perks: By storing this locally players will have faster access to photos after the initial sync is complete. 

Main app plans
[] Smart Sync (only syncs photos which are not already on the user's computer)
[] Left bar menu for switching between applications
[] Import and export settings
