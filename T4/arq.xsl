<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <xsl:template match="/">
        <xsl:result-document href="site/index.html"> <!-- gera esta ficheiro e guarda o output lá -->
            <html>
                <head>
                    <title>Arquivo Geológico</title>
                </head>
                <body>
                    <h2>Arquivo Geológico</h2>
                    <h3>Índice</h3>
                    <ol>
                        <xsl:apply-templates select="//ARQELEM" mode="indice">
                            <xsl:sort lang="PT">
                                <xsl:choose>
                                    <xsl:when test="substring(IDENTI,1,1)=' '"><xsl:value-of select="substring(IDENTI,2)"/></xsl:when>
                                    <xsl:otherwise><xsl:value-of select="IDENTI"/></xsl:otherwise>
                                </xsl:choose>
                            </xsl:sort>
                        </xsl:apply-templates> <!-- Travessia para gerar o índice -->
                    </ol>
                </body>
            </html>
        </xsl:result-document>
        <xsl:apply-templates select="//ARQELEM" mode="paginas"> <!-- Travessia para gerar as páginas dos registos -->
            <xsl:sort lang="PT"> <!-- É preciso garantir que as 2 travessias ocorrem pela mesma ordem, para garantir que os índices de navegação e os nomes dos ficheiros coincidem -->
                <xsl:choose>
                    <xsl:when test="substring(IDENTI,1,1)=' '"><xsl:value-of select="substring(IDENTI,2)"/></xsl:when>
                    <xsl:otherwise><xsl:value-of select="IDENTI"/></xsl:otherwise>
                </xsl:choose>
            </xsl:sort>
        </xsl:apply-templates> 
    </xsl:template>
    
    <!-- Templates de índice ............................................ -->
    
    <xsl:template match="ARQELEM" mode="indice"> <!-- ou tit aqui e . na linha abaixo -->
        <li>
            <a name="i{position()}"/>
            <a href="http://localhost:7777/arqs/{position()}"> <!-- salta para o ficheiro na diretoria atual com este id no nome -->
                <xsl:value-of select="IDENTI"/>
            </a>
        </li>
    </xsl:template>
    
    
    <!-- Templates de conteúdo ............................................ -->
    
    <xsl:template match="ARQELEM" mode="paginas">
        <xsl:result-document href="site/arq{position()}.html">
            <html>
                <head>
                    <title><xsl:value-of select="IDENTI"/></title>
                </head>
                <body>
                    <!-- Há elementos que aparecem em todos os registos, mas colorquei a condição de existência em todos para future proofing,
                    nada me garante que não possa haver uma falha de informação relativa a algum destes elementos -->
                    <xsl:if test="IMAGEM"><img src="../images/{IMAGEM/@NOME}" style="float: right; width: 30%; margin: 30px"/></xsl:if> <!-- só há uma imagem neste caso, mas a pasta é para ser mais escalável -->
                    <xsl:if test="IDENTI"><h1><xsl:value-of select="IDENTI"/></h1></xsl:if>
                    <xsl:if test="TIPO"><p><b>Tipo: </b><xsl:value-of select="TIPO/@ASSUNTO"/></p></xsl:if>
                    <xsl:if test="DESCRI"><p><b>Descrição: </b><xsl:apply-templates select="DESCRI"/></p></xsl:if>
                    <xsl:if test="CRONO"><p><b>Época: </b><xsl:value-of select="CRONO"/></p></xsl:if>
                    <xsl:if test="LUGAR and string-length(LUGAR) > 0"><p><b>Lugar: </b><xsl:value-of select="LUGAR"/></p></xsl:if> <!-- há uma tag destas sem valor -->
                    <xsl:if test="FREGUE"><p><b>Freguesia: </b><xsl:value-of select="FREGUE"/></p></xsl:if>
                    <xsl:if test="CONCEL"><p><b>Concelho: </b><xsl:value-of select="CONCEL"/></p></xsl:if>
                    <xsl:if test="CODADM"><p><b>Código administrativo: </b><xsl:value-of select="CODADM"/></p></xsl:if>
                    <xsl:if test="LATITU"><p><b>Latitude: </b><xsl:value-of select="LATITU"/></p></xsl:if>
                    <xsl:if test="LONGIT"><p><b>Longitude: </b><xsl:value-of select="LONGIT"/></p></xsl:if>
                    <xsl:if test="ALTITU"><p><b>Altitude: </b><xsl:value-of select="ALTITU"/></p></xsl:if>
                    <xsl:if test="ACESSO"><p><b>Acesso: </b><xsl:value-of select="ACESSO"/></p></xsl:if>
                    <xsl:if test="QUADRO"><p><b>Quadro: </b><xsl:value-of select="QUADRO"/></p></xsl:if>
                    <xsl:if test="TRAARQ"><p><b>Trabalhos arqueológicos: </b><xsl:value-of select="TRAARQ"/></p></xsl:if>
                    <xsl:if test="DESARQ"><p><b>Descrição arqueológica: </b><xsl:apply-templates select="DESARQ"/></p></xsl:if>
                    <xsl:if test="INTERP"><p><b>Interpretação: </b><xsl:apply-templates select="INTERP"/></p></xsl:if>
                    <xsl:if test="DEPOSI"><p><b>Depósito: </b><xsl:value-of select="DEPOSI"/></p></xsl:if>
                    <xsl:if test="INTERE"><p><b>Interesse: </b><xsl:value-of select="INTERE"/></p></xsl:if>
                    <xsl:if test="BIBLIO">
                        <p><b>Bibliografia: </b></p>
                        <ul>
                            <xsl:apply-templates select="BIBLIO" mode="biblio">
                                <xsl:sort select="."/>
                            </xsl:apply-templates>
                        </ul>
                    </xsl:if>
                    <xsl:if test="AUTOR"><p><b>Autor: </b>
                        <xsl:if test="string-length(AUTOR) = 0">Desconhecido</xsl:if>
                        <xsl:if test="string-length(AUTOR) > 0"><xsl:value-of select="AUTOR"/></xsl:if>
                    </p></xsl:if>
                    <xsl:if test="DATA"><p><b>Data: </b><xsl:value-of select="DATA"/></p></xsl:if>
                    
                    <address>
                        <xsl:choose>
                            <xsl:when test="position() = 1">[ - | </xsl:when> <!-- não deixar retroceder se for o primeiro elemento -->
                            <xsl:otherwise>[ <a href="http://localhost:7777/arqs/{position()-1}">Anterior</a> | </xsl:otherwise>
                        </xsl:choose>
                        <a href="http://localhost:7777/index#i{position()}">Índice</a><!-- volta para a home, especificamente para o índice desta página -->
                        <xsl:choose>
                            <xsl:when test="position() = last()"> | - ]</xsl:when> <!-- não deixar avançar se for o último elemento -->
                            <xsl:otherwise> | <a href="http://localhost:7777/arqs/{position()+1}">Pŕoximo</a> ]</xsl:otherwise>
                        </xsl:choose>
                    </address>
                </body>
            </html>
        </xsl:result-document>
    </xsl:template>
    
    <xsl:template match="LIGA">
        <i style="color: blue"><xsl:choose>
            <xsl:when test="contains(.,@TERMO)"><xsl:value-of select="."/></xsl:when>
            <xsl:otherwise><xsl:value-of select="@TERMO"/></xsl:otherwise>
        </xsl:choose></i>
    </xsl:template>
    
    <xsl:template match="DESCRI">
        <xsl:value-of select="."/>
        <xsl:if test="LIGA">(termo: <xsl:apply-templates select="LIGA"/>)</xsl:if>
    </xsl:template>
    
    <xsl:template match="BIBLIO" mode="biblio">
        <li><xsl:value-of select="."/></li>
    </xsl:template>
    
</xsl:stylesheet>