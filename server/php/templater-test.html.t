<html>
	<head>
	</head>
	<body>
		<table>
			<tr><td>[[@tr $row : * FROM Persons]][[$row.fio]]<td>[[$row.type]]<td>[[$row.{'12'+2}]]
				<table>
				<tr><td>[[@tr $det of $row :SELECT * FROM Docs WHERE a.autor.join]]
						[[$det.{NPP}]].[[$det.name]] - [[$det.autor.fio]]
				</tr>
				</table>
			</tr>
		</table>
	</body>
</html>
