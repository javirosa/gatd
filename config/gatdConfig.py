#
# This module converts a text config file to python classes and attributes.
#
# so
#  [mongo]
#  host: inductor.eecs.umich.edu
#
# becomes
#  gatdConfig.mongo.host
#


import ConfigParser
import sys

class BaseConfigSection (object):
	pass

config = ConfigParser.ConfigParser()
config.read('../config/gatd.config')

for section in config.sections():
	attrs = dict(config.items(section))

	# Convert integers to intergers
	for attr in attrs:
		try:
			attrs[attr] = int(attrs[attr])
		except ValueError:
			pass

	lattrs = dict((k.upper(), v) for k, v in attrs.iteritems())

	newclass = type(section, (BaseConfigSection,), lattrs)
	setattr(sys.modules[__name__], section, newclass)