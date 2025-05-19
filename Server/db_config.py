
import pymysql

def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',       
        password='',  
        db='mig_cart',            
        cursorclass=pymysql.cursors.DictCursor
    )
