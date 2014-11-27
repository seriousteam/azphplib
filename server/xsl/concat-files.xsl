<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
xmlns:concat="http://dummy/concat"
>
<xsl:template match="node()|@*">
     <xsl:copy>
       <xsl:apply-templates select="node()|@*"/>
     </xsl:copy>
</xsl:template>
<xsl:template match="concat:file">
	<xsl:copy-of select="document(.)/*/*"/>
</xsl:template>
</xsl:stylesheet>
