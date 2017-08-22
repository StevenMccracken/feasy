#Python 3
import argparse #docs https://docs.python.org/3/library/argparse.html
import PyPDF2 #docs https://pythonhosted.org/PyPDF2/
import sys
#import dateutil.parser #docs https://dateutil.readthedocs.io/ (doesnt seem like this lib will work out)

#allows arguments: python script.py file [-pdf | -txt | -docx] [-h] [-v]
parser = argparse.ArgumentParser(prog='Project Alpha', description='converts file to pure text before extracting information')
parser.add_argument('file', help="file location")
parser.add_argument('-v', '--version', action='version', version='%(prog)s 1.1')
group = parser.add_mutually_exclusive_group()
group.add_argument('-pdf', help='specify file type pdf (default)', action="store_true")
group.add_argument('-txt', help='specify file type txt', action="store_true")
group.add_argument('-docx', help='specify file type docx', action="store_true")
args = parser.parse_args()

print(args)
if args.pdf:
	print("PDF MODE ENABLED")
	file_type = 'pdf'
elif args.txt:
	print("TEXT MODE ENABLED")
	file_type = 'txt'
elif args.docx:
	print("DOCX MODE ENABLED")
	file_type = 'docx'
else:
	print("PDF MODE ENABLED (DEFAULT)")
	file_type = 'pdf'


pdfFileObj = open(args.file, 'rb')
pdfReader = PyPDF2.PdfFileReader(pdfFileObj)
print("encrypted: ",pdfReader.isEncrypted, end='\n\n')

text = [] # each page's text is store in the text array
for pageNum in range(pdfReader.getNumPages()-1):
	pageObj= pdfReader.getPage(pageNum)
	text.append(pageObj.extractText().encode('utf-8').decode('ascii', 'ignore')) #encode utf-8 and decode to ascii (ignoring characters) to avoid errors
print(text)

temp = ''
for s in range(len(text[0])-4):
	if text[0][s].isdigit(): 
		temp += text[0][s]
		if text[0][s+1].isdigit(): 
			temp += text[0][s+1]
			if text[0][s+2] == ':': 
				temp += ':'
				if text[0][s+3].isdigit(): 
					temp += text[0][s+3]
					if text[0][s+4].isdigit():
						temp += text[0][s+4]
					print("Time", temp, "Found at index", s)
		elif text[0][s+1] == ':': 
			temp += ':'
			if text[0][s+2].isdigit(): 
				temp += text[0][s+2]
				if text[0][s+3].isdigit(): 
					temp += text[0][s+3]
				print("Time", temp, "Found at index", s)
	temp = ''
