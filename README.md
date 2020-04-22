# Yinz ![Node.js CI](https://github.com/128technology/yinz/workflows/Node.js%20CI/badge.svg) [![npm version](https://badge.fury.io/js/%40128technology%2Fyinz.svg)](https://badge.fury.io/js/%40128technology%2Fyinz) 

A library for Node.js that can parse YIN ([RFC 6020](https://tools.ietf.org/html/rfc6020)) models and ingest XML instance data associated with them.  Note that is library is designed to work with consolidated XML models produced by [YINsolidated](https://github.com/128technology/yinsolidated), it will not work on standard YIN models.

This library aims to accomplish the following:
* Ingest XML datamodels produced by [YINsolidated](https://github.com/128technology/yinsolidated).
* Allow querying and walking of the ingested models, including support for the types outlined in [RFC 6020](https://tools.ietf.org/html/rfc6020).
* Ingest an XML instance of data matching the ingested datamodel. This typically comes from a [NETCONF](https://tools.ietf.org/html/rfc6241) response.
* Allow querying of the instance data, including evaluation of when conditions, leaf references, etc.
