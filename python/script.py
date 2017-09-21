#Python 3
import argparse #docs https://docs.python.org/3/library/argparse.html
import re 		#https://docs.python.org/3/library/re.html regex
import json 	#https://docs.python.org/2/library/json.html

#allows arguments: python script.py file [-h] [-file FILE] [-text TEXT] [-pretty] [-v]
parser = argparse.ArgumentParser(prog='Project Alpha', description='uses text and parses information into a JSON')
parser.add_argument('-file', help='specify .txt file')
parser.add_argument('-text', help='directly input a string of text')
parser.add_argument('-pretty', help='print json output as pretty format', action="store_true")
parser.add_argument('-v', '--version', action='version', version='%(prog)s 2.1')
args = parser.parse_args()

if args.file: # read from text file
	text_file = open(args.file,'r',encoding="utf-8",errors='replace') #open file in read-only mode
	text = text_file.read()
elif args.text: # read from string
	text = args.text
text.strip() # clean text (no spaces/gaps)

date_regex = re.compile('([0-2]{1}[0-9]|[3][01]|[0-9]{1})-((?:Jan(?:uary)?|(?:Feb)|(?:Mar)|(?:Apr)|(?:May)|(?:Jun)|(?:Jul)|(?:Aug)|(?:Sep)|(?:Oct)|(?:Nov)|(?:Dec)))', flags=re.IGNORECASE)

data = dict()
result = date_regex.search(text, 0)
while (result):
	date = result.group()
	desc_start = result.span()[1]
	new_result = date_regex.search(text, desc_start)
	if (new_result): desc_end = new_result.span()[0]
	else:
		break # End of Search
	description = text[desc_start:desc_end]
	data[date] = description.strip('\n') # add to dictionary
	result = new_result
if (args.pretty):
	print(json.dumps(data, indent=4))
else:
	print(json.dumps(data))

#print(result.span()[0])
#re.search('[0-9]{1,2}:[0-9]{2} ?(AM|PM)?','time with optional am/pm', flags=re.IGNORECASE)
#re.search('\b((?:Jan(?:uary)?|(?:Feb)|(?:Mar)|(?:Apr)|(?:May)|(?:Jun)|(?:Jul)|(?:Aug)|(?:Sep)|(?:Oct)|(?:Nov)|(?:Dec)))-([0-2]{1}[0-9]|[3][01]|[0-9]{1})','findtime', flags=re.IGNORECASE)
