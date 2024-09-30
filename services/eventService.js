const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();
const {
    teams2ScoreB, teams4ScoreB, teams8ScoreB, teams16ScoreB, teams24ScoreB, teams4TScoreB,
    teams2ScoreM, teams4ScoreM, teams8ScoreM, teams16ScoreM, teams24ScoreM, EventhostScore
  } = require('../utils/scoreUtils');


// 리그 데이터 제출 로직
const submitEvent = async (eventdata, tableName) => {
  const connection = await pool.getConnection();
  try {
    const {
      eventname,
      numberteams,
      teamSize,
      Championship1,
      Championship2,
      Championship3,
      Championship4,
      Runner_up1,
      Runner_up2,
      Runner_up3,
      Runner_up4,
      Place3rd1,
      Place3rd2,
      Place3rd3,
      Place3rd4,
      Eventhost,
    } = eventdata;

    const insertQuery = `
      INSERT INTO ${tableName} (
        accept,
        eventname,
        numberteams,
        teamSize,
        Championship1,
        Championship2,
        Championship3,
        Championship4,
        Runner_up1,
        Runner_up2,
        Runner_up3,
        Runner_up4,
        Place3rd1,
        Place3rd2,
        Place3rd3,
        Place3rd4,
        Eventhost
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(insertQuery, [
      eventname,
      numberteams,
      teamSize,
      Championship1,
      Championship2,
      Championship3,
      Championship4,
      Runner_up1,
      Runner_up2,
      Runner_up3,
      Runner_up4,
      Place3rd1,
      Place3rd2,
      Place3rd3,
      Place3rd4,
      Eventhost,
    ]);

  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  } finally {
    connection.release();
  }
};



// 이벤트 히스토리 조회
const getEventHistory = async (tableName) => {
    const connection = await pool.getConnection();
    try {
      const eventdata = await connection.query(`
        SELECT eventname, numberteams, teamSize,
          Championship1, Championship2, Championship3, Championship4,
          Runner_up1, Runner_up2, Runner_up3, Runner_up4,
          Place3rd1, Place3rd2, Place3rd3, Place3rd4, Eventhost, accept
        FROM ${tableName}
        ORDER BY OrderNum DESC;
      `);
      return eventdata;
    } catch (error) {
      console.error('Error fetching event history:', error);
      throw error;
    } finally {
      connection.release();
    }
  };
  
  // 이벤트 삭제
  const deleteEvent = async (tableName, eventname) => {
    const connection = await pool.getConnection();
    try {
      const deleteQuery = `DELETE FROM ${tableName} WHERE eventname = ?`;
      await connection.query(deleteQuery, [eventname]);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    } finally {
      connection.release();
    }
  };
  
  // 이벤트 승인
  const acceptEvent = async (eventdata, userTable, teamType) => {
    const connection = await pool.getConnection();
    const {
      eventname, numberteams, teamSize, Eventhost,
      Championship1, Championship2, Championship3, Championship4,
      Runner_up1, Runner_up2, Runner_up3, Runner_up4,
      Place3rd1, Place3rd2, Place3rd3, Place3rd4
    } = eventdata;
  
    const updateLScoreQuery = `UPDATE ${userTable} SET LScore = LScore + ? WHERE Nickname = ?`;
    const updateRScoreQuery = `UPDATE ${userTable} SET RScore = RScore + ? WHERE Nickname = ?`;

    let updateQueriesCham, updateQueriesRunner, updateQueries3rd;

    if (teamType === 'teamsM') {
      // teamsM일 때는 각 값에 '_m'을 추가
      updateQueriesCham = [Championship1, Championship2, Championship3, Championship4].map(value => value + '_m');
      updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4].map(value => value + '_m');
      updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4].map(value => value + '_m');
    } else {
      // teamsB일 때는 기존 값 사용
      updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
      updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
      updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];
    }
    
    
    let scoreData;
    if (teamType === 'teamsB') {
      scoreData = { teams2Score: teams2ScoreB, teams4Score: teams4ScoreB, teams8Score: teams8ScoreB, teams16Score: teams16ScoreB, teams24Score: teams24ScoreB, teams4TScore: teams4TScoreB };
    } else {
      scoreData = { teams2Score: teams2ScoreM, teams4Score: teams4ScoreM, teams8Score: teams8ScoreM, teams16Score: teams16ScoreM, teams24Score: teams24ScoreM };
    }
    
    try {
      await connection.beginTransaction();
  
      // Eventhost 점수 추가
      if (teamType === 'teamsB') {
        await connection.query(updateLScoreQuery, [EventhostScore, Eventhost]);
  
        const updateQuery = `UPDATE b_eventrecord SET accept = 2 WHERE eventname = ?`;
        await connection.query(updateQuery, [eventname]);
  
      } else {
        const updateQuery = `UPDATE m_eventrecord SET accept = 2 WHERE eventname = ?`;
        await connection.query(updateQuery, [eventname]);
      }
  
      switch (numberteams) {
        case 2:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [scoreData.teams2Score.Championship, updateValue]);
         }
          break;
  
        case 4:
          for (const updateValue of updateQueriesCham) {
            if (teamType === 'teamsB' && teamSize === 1) {
              await connection.query(updateLScoreQuery, [scoreData.teams4Score.Championship, updateValue]);
            } else {
              await connection.query(updateLScoreQuery, [scoreData.teams4TScore ? scoreData.teams4TScore.Championship : scoreData.teams4Score.Championship, updateValue]);
            }
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [scoreData.teams4Score.Runner_up, updateValue]);
          }
          break;
  
        case 8:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [scoreData.teams8Score.Championship, updateValue]);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [scoreData.teams8Score.Runner_up, updateValue]);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [scoreData.teams8Score.Place3rd, updateValue]);
          }
          break;
  
        case 16:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [scoreData.teams16Score.Championship, updateValue]);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [scoreData.teams16Score.Runner_up, updateValue]);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [scoreData.teams16Score.Place3rd, updateValue]);
          }
          break;
  
        case 24:

if (teamType==='teamsB')

  {            for (const updateValue of updateQueriesCham) {
    await connection.query(updateRScoreQuery, [scoreData.teams24Score.Championship, updateValue]);
  }
  for (const updateValue of updateQueriesRunner) {
    await connection.query(updateRScoreQuery, [scoreData.teams24Score.Runner_up, updateValue]);
  }
  for (const updateValue of updateQueries3rd) {
    await connection.query(updateRScoreQuery, [scoreData.teams24Score.Place3rd, updateValue]);
  }
}
else{
            for (const updateValue of updateQueriesCham) {
              await connection.query(updateLScoreQuery, [scoreData.teams24Score.Championship, updateValue]);
            }
            for (const updateValue of updateQueriesRunner) {
              await connection.query(updateLScoreQuery, [scoreData.teams24Score.Runner_up, updateValue]);
            }
            for (const updateValue of updateQueries3rd) {
              await connection.query(updateLScoreQuery, [scoreData.teams24Score.Place3rd, updateValue]);
            }
          }
          break;
      }
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error during transaction:', error);
      throw error;
    } finally {
      connection.release();
    }
  };
  



  const cancelAccepted = async (eventData) => {
    const { eventname, teamSize, numberteams, Championship1, Championship2, Championship3, Championship4, Runner_up1, Runner_up2, Runner_up3, Runner_up4, Place3rd1, Place3rd2, Place3rd3, Place3rd4, Eventhost } = eventData;
    const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
    const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
    const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];
    const updateLScoreQuery = `UPDATE b_user SET LScore = LScore - ? WHERE Nickname = ?`;
    const updateRScoreQuery = `UPDATE b_user SET RScore = RScore - ? WHERE Nickname = ?`;

  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      await connection.query(updateLScoreQuery, [EventhostScore, Eventhost]);
  
      switch (numberteams) {
        case 2:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams2ScoreB.Championship, updateValue]);
          }
          break;
        case 4:
          if (teamSize === 1) {
            for (const updateValue of updateQueriesCham) {
              await connection.query(updateLScoreQuery, [teams4ScoreB.Championship, updateValue]);
            }
            for (const updateValue of updateQueriesRunner) {
              await connection.query(updateLScoreQuery, [teams4ScoreB.Runner_up, updateValue]);
            }
          } else {
            for (const updateValue of updateQueriesCham) {
              await connection.query(updateLScoreQuery, [teams4TScoreB.Championship, updateValue]);
            }
            for (const updateValue of updateQueriesRunner) {
              await connection.query(updateLScoreQuery, [teams4TScoreB.Runner_up, updateValue]);
            }
          }
          break;
        case 8:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams8ScoreB.Championship, updateValue]);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [teams8ScoreB.Runner_up, updateValue]);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [teams8ScoreB.Place3rd, updateValue]);
          }
          break;
        case 16:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams16ScoreB.Championship, updateValue]);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [teams16ScoreB.Runner_up, updateValue]);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [teams16ScoreB.Place3rd, updateValue]);
          }
          break;
        case 24:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateRScoreQuery, [teams24ScoreB.Championship, updateValue]);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateRScoreQuery, [teams24ScoreB.Runner_up, updateValue]);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateRScoreQuery, [teams24ScoreB.Place3rd, updateValue]);
          }
          break;
      }
  
      const deleteQuery = `DELETE FROM b_eventrecord WHERE eventname = ?`;
      await connection.query(deleteQuery, [eventname]);
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
  
  const cancelAcceptedM = async (eventData) => {
    const { eventname, numberteams, Championship1, Championship2, Championship3, Championship4, Runner_up1, Runner_up2, Runner_up3, Runner_up4, Place3rd1, Place3rd2, Place3rd3, Place3rd4 } = eventData;
    const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
    const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
    const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];
    const updateLScoreQuery = `UPDATE m_user SET LScore = LScore - ? WHERE Nickname = ?`;
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      switch (numberteams) {
        case 2:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams2ScoreM.Championship, updateValue + '_m']);
          }
          break;
        case 4:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams4ScoreM.Championship, updateValue + '_m']);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [teams4ScoreM.Runner_up, updateValue + '_m']);
          }
          break;
        case 8:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams8ScoreM.Championship, updateValue + '_m']);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [teams8ScoreM.Runner_up, updateValue + '_m']);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [teams8ScoreM.Place3rd, updateValue + '_m']);
          }
          break;
        case 16:
          for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams16ScoreM.Championship, updateValue + '_m']);
          }
          for (const updateValue of updateQueriesRunner) {
            await connection.query(updateLScoreQuery, [teams16ScoreM.Runner_up, updateValue + '_m']);
          }
          for (const updateValue of updateQueries3rd) {
            await connection.query(updateLScoreQuery, [teams16ScoreM.Place3rd, updateValue + '_m']);
          }
          break;
          case 24:
            for (const updateValue of updateQueriesCham) {
              await connection.query(updateLScoreQuery, [teams24ScoreM.Championship, updateValue + '_m']);
            }
            for (const updateValue of updateQueriesRunner) {
              await connection.query(updateLScoreQuery, [teams24ScoreM.Runner_up, updateValue + '_m']);
            }
            for (const updateValue of updateQueries3rd) {
              await connection.query(updateLScoreQuery, [teams24ScoreM.Place3rd, updateValue + '_m']);
            }
            break;
            
      }
  
      const deleteQuery = `DELETE FROM m_eventrecord WHERE eventname = ?`;
      await connection.query(deleteQuery, [eventname]);
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };




module.exports = {
  submitEvent,
  getEventHistory,
  deleteEvent,
  acceptEvent,
  cancelAccepted,
  cancelAcceptedM
};
