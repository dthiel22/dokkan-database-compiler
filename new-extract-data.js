const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const sqliteDb = new sqlite3.Database('C:/Users/Alex/All Dokkan Stuff/Dokkan_Asset_Downloader_v2.2.2/DokkanFiles/global/en/sqlite/current/en/database.db');

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
  return new Promise(async (resolve, reject) => {
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

let numberOfProcessedCharacters = 0
async function main() {
    try {
      const sqliteDb = new sqlite3.Database('C:/Users/Alex/All Dokkan Stuff/Dokkan_Asset_Downloader_v2.2.2/DokkanFiles/global/en/sqlite/current/en/database.db');
      
      sqliteDb.all('SELECT * FROM cards', async (err, cardData) => {
        if (err) throw err;
        
        const processedCharacters = []; // Array to hold processed characters
  
        const processCard = async (row) => {
          // Check if any of the key fields is null, and skip the character if true
          if (row.leader_skill_set_id === null || row.passive_skill_set_id === null || row.link_skill1_id === null) {
            console.log(`Skipping character_id: ${row.id} due to missing key values.`);
            return;
          }
          
          // TODO: Comment in/out to run just one character
          if (numberOfProcessedCharacters === 1) {
            return;
          }
  
          const card = {};
  
          // Log the character_id
          console.log(`Processing character_id: ${row.character_id}`);
          numberOfProcessedCharacters++;
          console.log(numberOfProcessedCharacters);
  
          for (const column in row) {
            if (column === 'rarity') {
              if (row[column] === 4) {
                card[column] = 'UR';
              } else if (row[column] === 5) {
                card[column] = 'LR';
              } else {
                card[column] = row[column];
              }
            } else {
              card[column] = row[column];
            }
          }
  
          card.link_skills = await getLinkSkills(row.character_id);
          card.categories = await getCategoriesForCard(row.character_id);
  
          processedCharacters.push(card); // Add the card to the processedCharacters array
        };
        
        const promises = cardData.map((row) => processCard(row));
        
        // Filter out characters that were skipped (null values)
        const processedCards = promises.filter((card) => card !== null);
  
        Promise.all(processedCards)
          .then((result) => {
            const jsonData = JSON.stringify(processedCharacters, null, 2);
            fs.writeFileSync('all_character_data.json', jsonData);
            console.log('Data has been written to all_character_data.json');
            console.log(numberOfProcessedCharacters);
          })
          .catch((err) => {
            console.error(err);
          })
          .finally(() => {
            sqliteDb.close((err) => {
              if (err) {
                console.error(err);
              }
            });
          });
      });
    } catch (err) {
      console.error(err);
    }
  }
  
  main()