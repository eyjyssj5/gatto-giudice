"""Tests without downloading heavy voice models."""
import io
import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from voice_server import server

class VoiceServerTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(server.app)
        self.payload = {"text":"Ho deciso di studiare.","lang":"it","character":"dolce"}
        self.token = "abcdefghijklmnopqrstuvwxyz098765"

    def test_health_and_catalog(self):
        x=self.client.get("/health")
        self.assertEqual(x.status_code, 200)
        self.assertEqual(len(x.json()["languages"]),12)

    def test_never_open_no_secret(self):
        with patch.dict(os.environ,{},clear=True):
            r=self.client.post("/voce",json=self.payload,headers={"Authorization":"Bearer "+self.token})
            self.assertEqual(r.status_code, 503)

    def test_token_and_inputs(self):
        with patch.dict(os.environ,{"VOICE_SHARED_SECRET":self.token}):
            r=self.client.post("/voce",json=self.payload)
            self.assertEqual(r.status_code,401)
            r=self.client.post("/voce",json={**self.payload,"lang":"XX"},headers={"Authorization":"Bearer "+self.token})
            self.assertEqual(r.status_code,400)
            r=self.client.post("/voce",json={**self.payload,"text":"a"*500},headers={"Authorization":"Bearer "+self.token})
            self.assertEqual(r.status_code,422)

    def test_wav_is_returned_as_binary(self):
        with patch.dict(os.environ,{"VOICE_SHARED_SECRET":self.token}):
            with patch.object(server,"create_wav",return_value=b"RIFF"+b"\x00"*1000):
                r=self.client.post("/voce",json=self.payload,headers={"Authorization":"Bearer "+self.token})
                self.assertEqual(r.status_code,200)
                self.assertEqual(r.headers["content-type"],"audio/wav")
                self.assertTrue(r.content.startswith(b"RIFF"))

    def test_character_profiles_differ(self):
        self.assertEqual(len(server.CHARACTERS),3)
        self.assertNotEqual(server.CHARACTERS["dolce"],server.CHARACTERS["severo"])
        self.assertNotEqual(server.CHARACTERS["severo"],server.CHARACTERS["ironico"])

if __name__=="__main__":
    unittest.main()
