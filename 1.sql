-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: webrtc_text
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `name_id`
--

DROP TABLE IF EXISTS `name_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `name_id` (
  `usr_name` varchar(16) NOT NULL,
  `usr_id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`usr_name`),
  UNIQUE KEY `usr_id_UNIQUE` (`usr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `name_id`
--

LOCK TABLES `name_id` WRITE;
/*!40000 ALTER TABLE `name_id` DISABLE KEYS */;
INSERT INTO `name_id` VALUES ('user1',1),('user2',2);
/*!40000 ALTER TABLE `name_id` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usr_cred`
--

DROP TABLE IF EXISTS `usr_cred`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usr_cred` (
  `usr_id` int unsigned NOT NULL,
  `passw` binary(64) NOT NULL,
  `token` binary(16) NOT NULL,
  `last_updated` binary(4) NOT NULL,
  `salt` binary(32) NOT NULL,
  PRIMARY KEY (`usr_id`),
  CONSTRAINT `usr_id` FOREIGN KEY (`usr_id`) REFERENCES `name_id` (`usr_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usr_cred`
--

LOCK TABLES `usr_cred` WRITE;
/*!40000 ALTER TABLE `usr_cred` DISABLE KEYS */;
INSERT INTO `usr_cred` VALUES (1,_binary ':»€ª\íÏ­8e²x\ÉG7	Õ”J\Øñ\Ï	Ã\r«“u\ç]‡€«ó«4‰˜d\à‹)1ğsğÁAÿi\Ì\Ş\ï',_binary '\'\Öc[:S\î¤\\eñ¬\Ñ',_binary '2øf',_binary '–\Ú+ñ7\r>9‰3\Ûq\â>û\×,§\èÀ¿i“XG\ä'),(2,_binary '\ŞÁ%Ï¬°ølHVY\ÈŞªS£·¦<ƒ\É_\'\êM»¡œe\íÁ€ \îewX¹¸\\\ÕY(öFò½HôZñ\æ\n\İ\Å\é<ˆ',_binary '“õ—Ç¯õ_ñ\Õ·1©\å?ò',_binary 'øf',_binary 'i\Ó\'+Ê„\Â«\"\ì}OWo\âhÅ¾MgJ»‡¤-1');
/*!40000 ALTER TABLE `usr_cred` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-09-29 19:25:38
