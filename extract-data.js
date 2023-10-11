const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Connect to the SQLite database
const sqliteDb = new sqlite3.Database('C:/Users/Alex/All Dokkan Stuff/Dokkan_Asset_Downloader_v2.2.2/DokkanFiles/global/en/sqlite/current/en/database.db');

async function main() {
  try {
    // Extract data from SQLite
    sqliteDb.all('SELECT * FROM cards', async (err, characterData) => {
      if (err) throw err;

      const charactersToFile = [];
      let totalCharacterCount = 0;

      async function getLeaderSkillDescription(leaderSkillSetId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT description FROM leader_skill_sets WHERE id = ?', [leaderSkillSetId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              const description = row ? row.description : null;
      
              // Check if description is not null and remove newline and double quote characters
              if (description) {
                const cleanedDescription = description.replace(/\n/g, '').replace(/"/g, '');
                resolve(cleanedDescription);
              } else {
                resolve(null);
              }
            }
          });
        });
      }

      async function getPassiveSkillSetDescription(passiveSkillSetId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT description FROM passive_skill_sets WHERE id = ?', [passiveSkillSetId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              const description = row ? row.description : null;
      
              // Check if description is not null and remove newline and double quote characters
              if (description) {
                const cleanedDescription = description.replace(/\n/g, '').replace(/"/g, '');
                resolve(cleanedDescription);
              } else {
                resolve(null);
              }
            }
          });
        });
      }
      
      async function getSpecialSetId(cardId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT special_set_id FROM card_specials WHERE card_id = ?', [cardId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row ? row.special_set_id : null);
            }
          });
        });
      }

      async function getSpecialSetName(specialSetId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT name FROM special_sets WHERE id = ?', [specialSetId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              const name = row ? row.name : null;
      
              // Check if name is not null and remove newline and double quote characters
              if (name) {
                const cleanedName = name.replace(/\n/g, '').replace(/"/g, '');
                resolve(cleanedName);
              } else {
                resolve(null);
              }
            }
          });
        });
      }
      
      
      async function getSpecialSetDescription(specialSetId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT description FROM special_sets WHERE id = ?', [specialSetId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              const description = row ? row.description : null;
      
              // Check if description is not null and remove newline and double quote characters
              if (description) {
                const cleanedDescription = description.replace(/\n/g, '').replace(/"/g, '');
                resolve(cleanedDescription);
              } else {
                resolve(null);
              }
            }
          });
        });
      }
      
      

      async function getLinkSkills(cardId) {
        return new Promise((resolve, reject) => {
          sqliteDb.all('SELECT link_skill1_id, link_skill2_id, link_skill3_id, link_skill4_id, link_skill5_id, link_skill6_id, link_skill7_id FROM cards WHERE character_id = ?', [cardId], async (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const linkSkills = [];
              const linkSkillsColumnNames = ['link_skill1_id', 'link_skill2_id', 'link_skill3_id', 'link_skill4_id', 'link_skill5_id', 'link_skill6_id', 'link_skill7_id'];
      
              for (const columnName of linkSkillsColumnNames) {
                const linkSkillId = rows[0][columnName];
                if (linkSkillId) {
                  // Fetch the name of the link skill based on its ID
                  const linkSkillName = await getLinkSkillName(linkSkillId);
                  linkSkills.push(linkSkillName);
                }
              }
      
              resolve(linkSkills);
            }
          });
        });
      }
      
      async function getLinkSkillName(linkSkillId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT name FROM link_skills WHERE id = ?', [linkSkillId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row ? row.name : null);
            }
          });
        });
      }

      async function getCategoriesForCard(cardId) {
        return new Promise((resolve, reject) => {
          sqliteDb.all('SELECT card_category_id FROM card_card_categories WHERE card_id = ?', [cardId], async (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const categories = [];
      
              for (const row of rows) {
                const categoryId = row.card_category_id;
                if (categoryId) {
                  // Fetch the name of the category based on its ID
                  const categoryName = await getCategoryName(categoryId);
                  if (categoryName) {
                    categories.push(categoryName);
                  }
                }
              }
      
              resolve(categories);
            }
          });
        });
      }      

      async function getCategoryName(categoryId) {
        return new Promise((resolve, reject) => {
          sqliteDb.get('SELECT name FROM card_categories WHERE id = ?', [categoryId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row ? row.name : null);
            }
          });
        });
      }
      

      // Transform and add data to the charactersToFile array
      for (const characterRow of characterData) {
        let rarityDescription = "";
      
        // Set rarity description based on characterRow.rarity
        if (characterRow.rarity === 3) {
          rarityDescription = "SSR";
        } else if (characterRow.rarity === 4) {
          rarityDescription = "UR";
        } else if (characterRow.rarity === 5) {
          rarityDescription = "LR";
        }
      
        // Check if the rarity is 3 or above AND no empty leader or passive skill AND max_lv above 80 (to weed out SSRs)
        if (
          characterRow.rarity >= 3 &&
          characterRow.leader_skill_set_id != null &&
          characterRow.passive_skill_set_id != null
        ) {
          const leaderSkillDescription = await getLeaderSkillDescription(characterRow.leader_skill_set_id);
          const passiveSkillSetDescription = await getPassiveSkillSetDescription(characterRow.passive_skill_set_id);
          const linkSkills = await getLinkSkills(characterRow.character_id);
          const categories = await getCategoriesForCard(characterRow.id);
          const specialSetId = await getSpecialSetId(characterRow.id);
          const specialSetName = await getSpecialSetName(specialSetId);
          const specialSetDescription = await getSpecialSetDescription(specialSetId);

          
          // Check if the link_skills or category arrays are not empty
          if (linkSkills.length > 0 && categories.length > 0) {
            const characterDocument = {
              database_id: characterRow.id,
              name: characterRow.name,
              rarity: rarityDescription, // Set rarity description
              leader_skill: leaderSkillDescription,
              passive_skill: passiveSkillSetDescription,
              sa_id: specialSetId,
              sa_name: specialSetName,
              sa_description: specialSetDescription,
              hp_init: characterRow.hp_init,
              hp_max: characterRow.hp_max,
              atk_init: characterRow.atk_init,
              atk_max: characterRow.atk_max,
              def_init: characterRow.def_init,
              def_max: characterRow.def_max,
              Ki12: null,
              Ki24: null,
              eza_hp_init: null,
              eza_hp_max: null,
              eza_atk_init: null,
              eza_atk_max: null,
              eza_def_init: null,
              eza_def_max: null,
              link_skills: linkSkills,
              categories: categories
            };
      
            charactersToFile.push(characterDocument);
            
            totalCharacterCount++;
          }
        }
      }
      

      // Write characters to a JSON file
      fs.writeFileSync('character_data.json', JSON.stringify(charactersToFile, null, 2));

      // Add the total character count at the bottom
      fs.appendFileSync('character_data.json', `\n"total_characters": ${totalCharacterCount}`);

      // Close the SQLite database connection
      sqliteDb.close();
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
