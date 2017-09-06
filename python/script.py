#Python 3
import argparse #docs https://docs.python.org/3/library/argparse.html
import re #https://docs.python.org/3/library/re.html regex

#allows arguments: python script.py file [-h] [-file FILE] [-text TEXT] [-v]
parser = argparse.ArgumentParser(prog='Project Alpha', description='uses text and parses information')
parser.add_argument('-file', help='specify .txt file')
parser.add_argument('-text', help='directly input a string of text')
parser.add_argument('-v', '--version', action='version', version='%(prog)s 2.0')
args = parser.parse_args()

#print(args)
if args.file:
	print("reading from a text file...")
	#print(args.file)
	text_file = open(args.file,'r',encoding="utf-8",errors='replace') #open file in read-only mode
	text = text_file.read()
elif args.text:
	print("reading string of text...")
	text = args.text
text.strip()
#print(text)

date_regex = re.compile('([0-2]{1}[0-9]|[3][01]|[0-9]{1})-((?:Jan(?:uary)?|(?:Feb)|(?:Mar)|(?:Apr)|(?:May)|(?:Jun)|(?:Jul)|(?:Aug)|(?:Sep)|(?:Oct)|(?:Nov)|(?:Dec)))', flags=re.IGNORECASE)

output = []
result = date_regex.search(text, 0)
while (result):
	date = result.group()
	#print(date)
	desc_start = result.span()[1]
	new_result = date_regex.search(text, desc_start)
	if (new_result): desc_end = new_result.span()[0]
	else: 
		#print('End of Search')
		break
	description = text[desc_start:desc_end]
	#print(description)
	output.append((date,description))
	result = new_result
print(output)
	
#print(result.span()[0])
#re.search('[0-9]{1,2}:[0-9]{2} ?(AM|PM)?','time with optional am/pm', flags=re.IGNORECASE)
#re.search('\b((?:Jan(?:uary)?|(?:Feb)|(?:Mar)|(?:Apr)|(?:May)|(?:Jun)|(?:Jul)|(?:Aug)|(?:Sep)|(?:Oct)|(?:Nov)|(?:Dec)))-([0-2]{1}[0-9]|[3][01]|[0-9]{1})','findtime', flags=re.IGNORECASE)

'''
def findTime():
	temp = ''
	for s in range(len(text)-4):
		if text[s].isdigit(): 
			temp += text[s]
			if text[s+1].isdigit(): 
				temp += text[s+1]
				if text[s+2] == ':': 
					temp += ':'
					if text[s+3].isdigit(): 
						temp += text[s+3]
						if text[s+4].isdigit():
							temp += text[s+4]
						print("Time", temp, "Found at index", s)
			elif text[s+1] == ':': 
				temp += ':'
				if text[s+2].isdigit(): 
					temp += text[s+2]
					if text[s+3].isdigit(): 
						temp += text[s+3]
					print("Time", temp, "Found at index", s)
		temp = ''
#findTime()
'''