import requests
import time
import sqlite3
import tqdm
from bs4 import BeautifulSoup
from constants import CARD_TERMS, CARD_RANKS
import re

def num2str(num):
    return f"{num:03d}"

def Request_GET(url, retries=30):
    for i in range(retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()  # エラーチェック
            return response
        except requests.exceptions.RequestException as e:
            # print(f"Attempt {i+1}/{retries} failed: {e}")
            time.sleep(2)  # リトライの前に少し待機
    raise ConnectionError("Failed to connect after retries.")

def Scrape_main(search_name, card_term, card_rank):
    save_env = ["必要エナジー", "消費AP", "カード種類", "BP", "特徴", "発生エナジー", "効果", "トリガー"]
    save_data = {"id": "", "name": "", "imgpath":"", "必要エナジー":"", "消費AP":"", "カード種類":"", "BP":"", "特徴":"", "発生エナジー":"", "効果":"", "トリガー":""}

    # 特定のURLを検索
    # print("https://www.unionarena-tcg.com/jp/cardlist/detail_iframe.php?card_no=" + search_name)
    req = Request_GET("https://www.unionarena-tcg.com/jp/cardlist/detail_iframe.php?card_no=" + search_name)
    req.encoding = req.apparent_encoding # 日本語の文字化け防止

    # HTMLの解析
    bsObj = BeautifulSoup(req.text,"html.parser")
    items = bsObj.find_all("img")

    print("filename : " , items[0]['alt'], "search_name", search_name,  search_name in items[0]['alt'])
    print("access link :", "https://www.unionarena-tcg.com/jp/cardlist/detail_iframe.php?card_no=" + search_name)
    if search_name in items[0]['alt']:        
        r = Request_GET("https://www.unionarena-tcg.com/" + items[0]['src'])
        card_save_path = str('./picture/0.cardpicture/')+str(search_name.replace('/', '_'))+str('.png')
        with open(card_save_path, 'wb') as items[0]['img']:
                items[0]['img'].write(r.content)

        save_data["name"] = str(items[0]['alt']).replace(search_name, "")
        save_data['id'] = str(search_name.replace('/', '_'))
        save_data["imgpath"] = card_save_path

        cardDataTitle =  bsObj.find_all(class_="cardDataTit")
        cartDataContent = bsObj.find_all(class_="cardDataContents")
        for i in range(0, len(cardDataTitle)):
            # print ("cardDataTitle   : ", cardDataTitle[i].text)

            if cardDataTitle[i].text == save_env[0]:
                if cartDataContent[i].find('img')['alt']:
                    save_path = str('./picture/1.required_energy/')+str(cartDataContent[i].find('img')['alt'])+str('.png')
                    r = Request_GET("https://www.unionarena-tcg.com"+ str(cartDataContent[i].find('img')['src']))
                    print("imglink :", "https://www.unionarena-tcg.com"+ str(cartDataContent[i].find('img')['src']))
                    with open(save_path, 'wb') as cartDataContent[i].find('img')['src']:
                        cartDataContent[i].find('img')['src'].write(r.content)
                    save_data['必要エナジー'] = str(cartDataContent[i].find('img')['alt'])

            elif cardDataTitle[i].text == save_env[1]:
                save_data['消費AP'] = str(cartDataContent[i].text)
                    
            elif cardDataTitle[i].text == save_env[2]:
                save_data['カード種類'] = str(cartDataContent[i].text)

            elif cardDataTitle[i].text == save_env[3]:
                save_data['BP'] = str(cartDataContent[i].text)
                
            elif cardDataTitle[i].text == save_env[4]:
                save_data['特徴'] = str(cartDataContent[i].text)
            
            elif cardDataTitle[i].text == save_env[5]:
                result = str(cartDataContent[i])
                save_text_data = ""
                idx = 0
                if '<img alt=' in str(cartDataContent[i]):
                    img_list = cartDataContent[i].find_all('img')
                    tmp_data = str(cartDataContent[i]).replace('<dd class="cardDataContents">', '')
                    tmp_data = tmp_data.replace('</dd>', '')

                    if '<br/>' in tmp_data:
                        tmp_data = tmp_data.replace('<br/>', '')

                    # 正規表現パターン
                    pattern = r'(<img [^>]+/>)(.*?)(?=<img|$)'
                    # 分割処理
                    matches = re.findall(pattern, tmp_data)
                    for match in matches:
                        # print(match[1], match[0])
                        tmp_data = tmp_data.replace(match[0], "*" + img_list[idx]['alt'] + "*" + match[1])
                        
                        save_path = str('./picture/3.effect/')+str(img_list[idx]['alt'])+str('.png')
                        r = Request_GET("https://www.unionarena-tcg.com"+ str(img_list[idx]['src']))
                        with open(save_path, 'wb') as img_list[idx]['src']:
                            img_list[idx]['src'].write(r.content)
                        idx += 1
                    result = tmp_data
                else:
                    result = str(cartDataContent[i].text)

                save_data['発生エナジー'] = result

            elif cardDataTitle[i].text == save_env[6]:
                result = str(cartDataContent[i])
                save_text_data = ""
                idx = 0
                if '<img alt=' in str(cartDataContent[i]):
                    img_list = cartDataContent[i].find_all('img')
                    tmp_data = str(cartDataContent[i]).replace('<dd class="cardDataContents">', '')
                    tmp_data = tmp_data.replace('</dd>', '')

                    if '<br/>' in tmp_data:
                        tmp_data = tmp_data.replace('<br/>', '')

                    # 正規表現パターン
                    pattern = r'(<img [^>]+/>)(.*?)(?=<img|$)'
                    # 分割処理
                    matches = re.findall(pattern, tmp_data)
                    for match in matches:
                        # print(match[1], match[0])
                        tmp_data = tmp_data.replace(match[0], "*" + img_list[idx]['alt'] + "*" + match[1])
                        
                        save_path = str('./picture/3.effect/')+str(img_list[idx]['alt'])+str('.png')
                        r = Request_GET("https://www.unionarena-tcg.com"+ str(img_list[idx]['src']))
                        with open(save_path, 'wb') as img_list[idx]['src']:
                            img_list[idx]['src'].write(r.content)
                        idx += 1
                    result = tmp_data
                else:
                    result = str(cartDataContent[i].text)

                save_data['効果'] = result

            elif cardDataTitle[i].text == save_env[7]:

                result = str(cartDataContent[i])
                save_text_data = ""
                idx = 0
                if '<img alt=' in str(cartDataContent[i]):
                    img_list = cartDataContent[i].find_all('img')
                    tmp_data = str(cartDataContent[i]).replace('<dd class="cardDataContents">', '')
                    tmp_data = tmp_data.replace('</dd>', '')

                    if '<br/>' in tmp_data:
                        tmp_data = tmp_data.replace('<br/>', '')

                    # 正規表現パターン
                    pattern = r'(<img [^>]+/>)(.*?)(?=<img|$)'
                    # 分割処理
                    matches = re.findall(pattern, tmp_data)
                    for match in matches:
                        # print(match[1], match[0])
                        tmp_data = tmp_data.replace(match[0], "*" + img_list[idx]['alt'] + "*" + match[1])
                        
                        save_path = str('./picture/3.effect/')+str(img_list[idx]['alt'])+str('.png')
                        r = Request_GET("https://www.unionarena-tcg.com"+ str(img_list[idx]['src']))
                        with open(save_path, 'wb') as img_list[idx]['src']:
                            img_list[idx]['src'].write(r.content)
                        idx += 1
                    result = tmp_data
                else:
                    result = str(cartDataContent[i].text)
                save_data['トリガー'] = result
        return save_data
    return -1

class DB_communicate():
    def __init__(self) -> None:
        # SQLiteデータベースに接続
        self.conn = sqlite3.connect('Card.db')
        self.cursor = self.conn.cursor()

        # テーブル作成
        self.cursor.execute('CREATE TABLE IF NOT EXISTS card_table (id TEXT, imgpath TEXT, name TEXT, "必要エナジー" TEXT, "消費AP" TEXT, "カード種類" TEXT, "BP" TEXT, "特徴" TEXT, "発生エナジー" TEXT, "効果" TEXT, "トリガー" TEXT )')
    
    def insert(self, insert_data):
        # データのインサート
        self.cursor.execute('INSERT INTO card_table (id, imgpath, name, "必要エナジー", "消費AP", "カード種類", "BP", "特徴", "発生エナジー", "効果", "トリガー") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (insert_data['id'],insert_data['imgpath'], insert_data['name'], insert_data['必要エナジー'],insert_data['消費AP'],insert_data['カード種類'],insert_data['BP'],insert_data['特徴'],insert_data['発生エナジー'],insert_data['効果'],insert_data['トリガー']))

        # コミットして変更を保存
        self.conn.commit()
    
    def db_close(self):
        # 接続を閉じる
        self.conn.close()

if __name__  == '__main__':
    db_controll = DB_communicate()

    for raw_number in tqdm.tqdm(range(1, 300)):
        for raw_card_rank in CARD_RANKS:
            for raw_card_term in CARD_TERMS:
                for raw_version in range(1, 3):
                    search_name = raw_card_rank + '/'+ raw_card_term + "-" + str(raw_version) + "-"+ num2str(raw_number) + "_p1"
                    save_data = Scrape_main(search_name, CARD_TERMS, CARD_RANKS)
                    if save_data != -1:
                        db_controll.insert(save_data)
                    search_name = raw_card_rank + '/'+ raw_card_term + "-" + str(raw_version) + "-"+ num2str(raw_number)
                    save_data = Scrape_main(search_name, CARD_TERMS, CARD_RANKS)
                    if save_data != -1:
                        db_controll.insert(save_data)
    db_controll.db_close