<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="table" mode="m2">
    <xsl:param name="tbl" />
    <xsl:param name="row" />
    <xsl:param name="col" />
    <xsl:for-each select="*[name()=$row]">
      <xsl:element name="{$tbl}">
	<xsl:for-each select="*[name()=$col]">
	  <xsl:variable name="aname" select="@name"/>
	  <xsl:attribute name="{$aname}">
	    <xsl:value-of select="." />
	  </xsl:attribute>
	</xsl:for-each>
      </xsl:element>
    </xsl:for-each>
  </xsl:template>

</xsl:stylesheet>
