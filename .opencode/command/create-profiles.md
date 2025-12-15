---
description: Create new profiles for the Perfil project.
agent: build
model: github-copilot/gpt-5-mini
---

## PREPARATION

Before start, ask the user how many profiles he wants to create. Only create the profiles he asks for.

**VERY IMPORTANT** DO NOT create more profiles than the number of profiles he asked for, NEVER.

First, read the @config/profiles.config.json to get:
1- The list of categories
2- The list of languages
3- The current profiles for each category and language, so you can check if you are not creating any duplication.

Read the @config/profiles.schema.json to get the profile data file structure.

These are places you can get the data to create the clues:
- Wikipedia
- Any Fandom wiki, like https://starwars.fandom.com/
- Any Celebreties Wiki
- https://www.imdb.com/
- https://www.rottentomatoes.com/
- and any other you may know of.

To identify how to search for profiles and decide which one to use, look at the description field in the @config/profiles.config.json file. In this field, you will find a description of what types of profiles, for that category we are looking for.

## CREATION

**VERY IMPORTANT** DO NOT create profiles with the same name, NEVER.
**VERY IMPORTANT** DO NOT create less or more than 20 clues for each profile.

Create profiles for each category and language, following the schema defined in the @config/profiles.schema.json file and the rules present in this file.
For each category, check if you could write more profiles in the existing file (they should not have more than 100 profiles) and if not a new data file for that category/language, with the correct data file name and order.

Once the profiles are created, update the profiles.config.json file with the new profiles, so we do not duplicate it later.

If you have created new data files, please also update public/data/manifest.json file with the new data files.

The profiles clues **MUST** be written in the language of the file.

The profile clues **MUST NOT** have the name of the profile in them and should be meaninful.

### TIPS FOR CREATING PROFILES

- Movies: Try to create profiles not only about movies, but also about the actors, characters from a movie, directors, and other relevant people.
- Animals: Try to create profiles not only about real animals, but also about fictional animals, and the different habitats they live in.
- Famous People: Try to create profiles not only about real people, but also about fictional people from Books, for example.
- Sports: Try to create profiles not only about sports, but also about the different teams, players, and events in that sport (like the soccer world cup).
- Countries: Try to create profiles not only about countries, but also about cities, languages, and other relevant things, like the capital city, currency,  population, tourism, and other things.
- Technology: Try to create profiles not only about technologies, but also about the different companies, products, and events in that technology (like the iPhone 14) and also about fictional technologies, like the Star Trek enterprise, etc.

## RULES TO FOLLOW

**VERY IMPORTANT** All profiles createed **MUST** have exactly 20 clues, no more, no less. Once you have created the profiles, please review this and make sure it is the case (remove or add clues if needed).

**NEVER** Remove, modify or substitute any profile from the existing data files.
**DO** Use the profiles.config.json file to get the list of categories, languages, and current profiles (to avoid creating duplicates - you don't need to read all data files to get this list, they will be here in profiles.config)
**DO NOT** Put more than 100 profiles in the same data file. If a profile category has more than 100 profiles, create a new data file for that category.
**DO** create the profile in the public/data folder, in the correct category folder, in the correct language folder, and with the correct data file name.
**NEVER** Create more profiles than requested by the user.
**NEVER** Duplicate any profile.
**DO NOT** create any other file in the public/data folder.
**DO NOT** create any other file in the @config folder.
**DO NOT** create any other file in the public folder.
**TRY** to create the same profile for all available languages, if possible and unless explicitly stated otherwise.
**DO** create profiles with different difficulty levels, if possible and unless explicitly stated otherwise.
**DO** try to balance the number of profiles for each category, if possible.
**DO** try to balance the number of profiles for each difficulty level, if possible.
**DO** use the profile ID format `profile-{category}-{number}` (e.g., `profile-animal-001`) to ensure globally unique IDs across all categories.
**DO** the clues need to start from hard ones and then move to easier ones. The first 5 ones should be hard to the players to guess, and the last 5 ones should be easier.
**DO** after all profiles are created, review if there is no Error in the JSON files. If there is, fix it.
**DO NOT** create any other data file if the last one, in the order, does not have more than 100 profiles. So for example if the last one is data-3.json check if it has more than 100 profiles before create the data-4.json.
**IMPORTANT** Be sure to check if the profile you are creating is not already in the existing data files.
**IMPORTANT** Be sure to use correct language in the profile name, category and clues.

Once you have all the information, create the profiles as requested by the user.
