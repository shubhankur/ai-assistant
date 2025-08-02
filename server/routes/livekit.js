const express = require('express');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const router = express.Router();

router.get('/token', async (req, res) => {
  const metadataStr = req.query.metadata;
  let meta;
  try {
    meta = JSON.parse(metadataStr);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid metadata' });
  }
  if (meta.userId) id = meta.userId;
  else return res.status(500).json({ error: 'Missing User Id' });

  const identity = id;
  const roomName = `roomba-${id}-${Date.now()}`;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;

  if (!serverUrl || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Missing credentials' });
  }

  const roomSvc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
  try {
    await roomSvc.deleteRoom(roomName);
  } catch (err) {
    // ignore
  }
  try {
    await roomSvc.createRoom({ name: roomName, metadata: metadataStr, departureTimeout: 5, maxParticipants:2 });
  } catch (err) {
    console.log('Room already exists');
    await roomSvc.updateRoomMetadata(roomName, metadataStr);
  }

  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName, canUpdateOwnMetadata: true, canPublishData: true, canSubscribe: true });
  at.metadata = metadataStr;
  const token = await at.toJwt();
  return res.json({ token, serverUrl });
});

module.exports = router;
