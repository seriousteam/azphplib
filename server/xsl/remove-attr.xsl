<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:param name="attr"/>

  <xsl:template match="*">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name() = $attr)]"/>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
