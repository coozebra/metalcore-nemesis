## Infantry Genesis Scripts

The order of execution of these scripts to generate the 10k assets was:

- importAssets: imported **10003** assets on the database.
- killThree: randomly removed **3** units to achieve the cap of 10k.
- assignTokenIds: randomly assign the tokenId for each one of the stored infantry
- assertAssets: to assure every one of the 10k has one tokenId
- countRarity: to check how many of each unit type were generated

- clearTokenIds was used to re-roll the tokenIds before testing, and before the final roll.
